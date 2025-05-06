import os
import pandas as pd
import psycopg2
import requests
import zipfile
import io
import logging
from dotenv import load_dotenv
import time
import requests

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Load environment variables
load_dotenv()

# MovieLens small dataset URL
MOVIELENS_URL = "https://files.grouplens.org/datasets/movielens/ml-latest-small.zip"

def download_and_extract_dataset():
    """Download and extract the MovieLens dataset"""
    logging.info("Downloading MovieLens dataset...")
    response = requests.get(MOVIELENS_URL)
    
    if response.status_code != 200:
        logging.error(f"Failed to download dataset: {response.status_code}")
        return None
    
    logging.info("Extracting dataset...")
    z = zipfile.ZipFile(io.BytesIO(response.content))
    z.extractall("data")
    
    return "data/ml-latest-small"

def load_movies(dataset_path):
    """Load and preprocess movies data"""
    movies_df = pd.read_csv(f"{dataset_path}/movies.csv")
    
    # Extract the first genre as primary genre
    movies_df['genre'] = movies_df['genres'].apply(lambda x: x.split('|')[0] if '|' in x else x)
    
    # Extract year from title
    movies_df['release_year'] = movies_df['title'].str.extract(r'\((\d{4})\)').iloc[:, 0]
    movies_df['title'] = movies_df['title'].str.replace(r' \(\d{4}\)', '', regex=True)
    
    # Add a default poster URL (could be replaced with actual poster URLs)
    movies_df['poster_url'] = movies_df['movieId'].apply(
        lambda x: f"https://via.placeholder.com/300x450.png?text=Movie+{x}"
    )
    
    # Add a description (we'll use a placeholder since MovieLens doesn't include descriptions)
    movies_df['description'] = movies_df.apply(
    lambda row: get_movie_description(row['title'], row['release_year']), 
    axis=1
)
    
    # Set a default rating (we'll calculate actual average later)
    movies_df['poster_url'] = movies_df.apply(
    lambda row: get_movie_poster(row['title'], row['release_year']), 
    axis=1
)
    
    return movies_df

def load_ratings(dataset_path):
    """Load ratings data"""
    return pd.read_csv(f"{dataset_path}/ratings.csv")

def calculate_average_ratings(movies_df, ratings_df):
    """Calculate average rating for each movie"""
    avg_ratings = ratings_df.groupby('movieId')['rating'].mean().reset_index()
    
    # Merge with movies dataframe
    movies_df = movies_df.merge(avg_ratings, on='movieId', how='left')
    
    # Replace the placeholder rating with the actual average
    movies_df['rating'] = movies_df['rating_y'].fillna(0)
    
    # Drop the extra column
    movies_df = movies_df.drop(columns=['rating_y'])
    
    return movies_df

def import_to_database(movies_df):
    """Import processed movie data to PostgreSQL database"""
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        # Clear existing data
        cur.execute("TRUNCATE TABLE movies RESTART IDENTITY CASCADE")
        
        # Insert movie data
        for _, movie in movies_df.iterrows():
            cur.execute(
                """
                INSERT INTO movies (title, description, genre, rating, release_year, poster_url)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    movie['title'],
                    movie['description'],
                    movie['genre'],
                    float(movie['rating']),
                    int(movie['release_year']) if pd.notna(movie['release_year']) else None,
                    movie['poster_url']
                )
            )
        
        conn.commit()
        logging.info(f"Successfully imported {len(movies_df)} movies")
        
    except Exception as e:
        logging.error(f"Database import error: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()
TMDB_API_KEY = "your_tmdb_api_key"

def get_movie_poster(title, year=None):
    """Get movie poster URL from TMDB API"""
    try:
        search_url = f"https://api.themoviedb.org/3/search/movie"
        params = {
            "api_key": TMDB_API_KEY,
            "query": title,
            "year": year
        }
        
        response = requests.get(search_url, params=params)
        data = response.json()
        
        if "results" in data and data["results"]:
            poster_path = data["results"][0]["poster_path"]
            if poster_path:
                return f"https://image.tmdb.org/t/p/w500{poster_path}"
        
        # Add a small delay to avoid hitting rate limits
        time.sleep(0.25)
        
    except Exception as e:
        logging.error(f"Error fetching poster for {title}: {e}")
    
    # Return placeholder if no poster found
    return f"https://via.placeholder.com/500x750.png?text={title.replace(' ', '+')}"

# Then in your load_movies function, replace the placeholder URL with:
def get_movie_description(title, year=None):
    """Get movie description from TMDB API"""
    try:
        search_url = f"https://api.themoviedb.org/3/search/movie"
        params = {
            "api_key": TMDB_API_KEY,
            "query": title,
            "year": year
        }
        
        response = requests.get(search_url, params=params)
        data = response.json()
        
        if "results" in data and data["results"]:
            overview = data["results"][0]["overview"]
            if overview:
                return overview
        
        # Add a small delay to avoid hitting rate limits
        time.sleep(0.25)
        
    except Exception as e:
        logging.error(f"Error fetching description for {title}: {e}")
    
    # Return placeholder if no description found
    return f"No description available for {title}."


def main():
    """Main function to coordinate the import process"""
    # Download and extract dataset
    dataset_path = download_and_extract_dataset()
    if not dataset_path:
        return
    
    # Load and process movie data
    movies_df = load_movies(dataset_path)
    
    # Load ratings data
    ratings_df = load_ratings(dataset_path)
    
    # Calculate average ratings
    movies_df = calculate_average_ratings(movies_df, ratings_df)
    
    # Limit to a reasonable number (e.g., 1000) for initial import
    movies_df = movies_df.head(1000)
    
    # Import to database
    import_to_database(movies_df)
    
    logging.info("MovieLens data import completed")

if __name__ == "__main__":
    main()