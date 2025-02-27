import sys
import pickle
import pandas as pd
import json
import psycopg2
import numpy as np
import os  # Add missing import

def get_movies_from_db():
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute("SELECT id, title, description, genre, rating, poster_url FROM movies")  # Add missing columns
    movies = cur.fetchall()
    conn.close()
    return pd.DataFrame(movies, columns=["id", "title", "description", "genre", "rating", "poster_url"])

# Load models
try:
    with open("tfidf_model.pkl", "rb") as f:
        tfidf = pickle.load(f)
    with open("cosine_sim.pkl", "rb") as f:
        cosine_sim = pickle.load(f)
except FileNotFoundError as e:
    print(f"Error loading model files: {e}")
    sys.exit(1)

# Get liked movie IDs
if len(sys.argv) < 2:
    print("Error: No movie IDs provided.")
    sys.exit(1)

try:
    liked_movie_ids = list(map(int, sys.argv[1].split(",")))
except ValueError as e:
    print(f"Error parsing movie IDs: {e}")
    sys.exit(1)

# Get recommendations
movies = get_movies_from_db()
recommendations = set()

for movie_id in liked_movie_ids:
    try:
        idx = movies.index[movies["id"] == movie_id].tolist()[0]
        sim_scores = list(enumerate(cosine_sim[idx]))
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)[1:6]
        movie_indices = [i[0] for i in sim_scores]
        for i in movie_indices:
            recommendations.add(movies["id"].iloc[i])
    except IndexError:
        print(f"Movie ID {movie_id} not found")
        continue

# Prepare output
recommendations = [int(movie_id) for movie_id in recommendations]
recommended_movies = movies[movies["id"].isin(recommendations)].to_dict("records")
print(json.dumps(recommended_movies))