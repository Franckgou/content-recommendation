import sys
import pickle
import pandas as pd
import json
import psycopg2
import numpy as np
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def get_movies_from_db():
    """Fetch all movies from the database"""
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        cur.execute("SELECT id, title, description, genre, rating, release_year, poster_url FROM movies")
        movies = cur.fetchall()
        conn.close()
        
        # Create DataFrame with all necessary columns
        return pd.DataFrame(
            movies, 
            columns=["id", "title", "description", "genre", "rating", "release_year", "poster_url"]
        )
    except Exception as e:
        print(f"Error fetching movies: {str(e)}", file=sys.stderr)
        return pd.DataFrame(
            columns=["id", "title", "description", "genre", "rating", "release_year", "poster_url"]
        )

def get_liked_movies(user_id):
    """Get the movies that the user has liked"""
    try:
        # Validate user_id is a valid integer
        user_id = int(user_id)
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        cur.execute(
            "SELECT movie_id FROM user_interactions WHERE user_id = %s AND liked = TRUE",
            [user_id]
        )
        liked_movies = [row[0] for row in cur.fetchall()]
        conn.close()
        return liked_movies
    except (ValueError, TypeError) as e:
        print(f"Invalid user ID format: {str(e)}", file=sys.stderr)
        return []
    except Exception as e:
        print(f"Error fetching liked movies: {str(e)}", file=sys.stderr)
        return []

def generate_movie_features(movies_df):
    """Generate content features from movie data for similarity calculation"""
    try:
        # Combine relevant fields into a single string for each movie
        movies_df['features'] = movies_df['title'] + ' ' + movies_df['genre'] + ' ' + movies_df['description']
        
        # Create TF-IDF features
        tfidf = TfidfVectorizer(stop_words='english')
        tfidf_matrix = tfidf.fit_transform(movies_df['features'].fillna(''))
        
        # Calculate cosine similarity between movies
        cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)
        
        return cosine_sim
    except Exception as e:
        print(f"Error generating features: {str(e)}", file=sys.stderr)
        # Return identity matrix as fallback
        return np.identity(len(movies_df))

def main():
    try:
        # Check if we received a user ID
        if len(sys.argv) < 2:
            print(json.dumps([]))
            return
            
        user_id = sys.argv[1]
        
        # Early validation of user_id
        try:
            int(user_id)  # Will raise ValueError if not convertible to int
        except (ValueError, TypeError):
            print(f"Invalid user ID format: {user_id}", file=sys.stderr)
            print(json.dumps([]))
            return
            
        # Get liked movies for this user
        liked_movie_ids = get_liked_movies(user_id)
        
        # If user hasn't liked any movies yet, return empty list
        if not liked_movie_ids:
            print(json.dumps([]))
            return
            
        # Get all movies
        movies_df = get_movies_from_db()
        
        if movies_df.empty:
            print(json.dumps([]))
            return
            
        # If we have model files saved, try to load them
        try:
            with open("cosine_sim.pkl", "rb") as f:
                cosine_sim = pickle.load(f)
        except FileNotFoundError:
            # If models don't exist, generate them
            cosine_sim = generate_movie_features(movies_df)
            # Optionally save for future use
            try:
                with open("cosine_sim.pkl", "wb") as f:
                    pickle.dump(cosine_sim, f)
            except Exception as e:
                print(f"Warning: Could not save similarity matrix: {str(e)}", file=sys.stderr)
                # Continue without saving
        
        # Get recommendations based on liked movies
        recommendations = set()
        for movie_id in liked_movie_ids:
            try:
                # Find the movie's index in our dataframe
                idx = movies_df.index[movies_df["id"] == movie_id].tolist()[0]
                
                # Get similarity scores for this movie with all others
                sim_scores = list(enumerate(cosine_sim[idx]))
                
                # Sort by similarity score (descending)
                sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
                
                # Get top 5 most similar movies (excluding the movie itself)
                similar_movies = [i[0] for i in sim_scores[1:6]]
                
                # Add to recommendations set (to avoid duplicates)
                for movie_idx in similar_movies:
                    movie_id = movies_df["id"].iloc[movie_idx]
                    if movie_id not in liked_movie_ids:  # Don't recommend already liked movies
                        recommendations.add(movie_id)
            except (IndexError, ValueError) as e:
                # If the movie ID isn't found, just continue to the next one
                continue
        
        # Convert to list and limit to 10 recommendations
        recommendations = list(recommendations)[:10]
        
        if not recommendations:
            # Fallback to popular movies if no recommendations found
            try:
                conn = psycopg2.connect(os.environ['DATABASE_URL'])
                cur = conn.cursor()
                cur.execute("""
                    SELECT DISTINCT movie_id 
                    FROM user_interactions 
                    WHERE liked = TRUE 
                    AND movie_id NOT IN %s
                    GROUP BY movie_id 
                    ORDER BY COUNT(*) DESC 
                    LIMIT 10
                """, [tuple(liked_movie_ids) if liked_movie_ids else (0,)])
                
                recommendations = [row[0] for row in cur.fetchall()]
                conn.close()
            except Exception as e:
                print(f"Error fetching popular movies: {str(e)}", file=sys.stderr)
                # Return empty list if fallback fails
                print(json.dumps([]))
                return
        
        # Get full movie details for the recommendations
        recommended_movies = movies_df[movies_df["id"].isin(recommendations)].to_dict("records")
        
        # Convert to JSON and print (this will be captured by the Node.js script)
        print(json.dumps(recommended_movies))
    
    except Exception as e:
        # In case of any error, return empty array and log the error
        print(f"Error in recommendation system: {str(e)}", file=sys.stderr)
        print(json.dumps([]))

if __name__ == "__main__":
    main()