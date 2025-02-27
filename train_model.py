import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import os
import csv  # Added for quoting parameter

# Debugging: Print current working directory
print("Current Working Directory:", os.getcwd())

# Check if the file exists
if not os.path.exists("movies.csv"):
    raise FileNotFoundError("The file 'movies.csv' does not exist in the current directory.")

# Load movie data
try:
    movies = pd.read_csv(
        "movies.csv", 
        sep=',', 
        quoting=csv.QUOTE_MINIMAL, 
        encoding='utf-8', 
        on_bad_lines='skip'  # Use 'skip' to skip bad lines or 'warn' to warn and skip
    )
except Exception as e:
    raise Exception(f"Error loading 'movies.csv': {e}")

# Debugging: Print the first few rows of the DataFrame
print("Loaded Data:")
print(movies.head())

# Verify required columns exist
required_columns = ["id", "title", "description", "genre"]
for column in required_columns:
    if column not in movies.columns:
        raise KeyError(f"Column '{column}' not found in 'movies.csv'. Please check the file.")

# Combine features into a single text column
movies["combined_features"] = (
    movies["title"] + " " + movies["description"] + " " + movies["genre"]
)

# Debugging: Print the combined features
print("Combined Features:")
print(movies["combined_features"].head())

# Convert text to TF-IDF vectors
tfidf = TfidfVectorizer(stop_words="english")
tfidf_matrix = tfidf.fit_transform(movies["combined_features"])

# Calculate cosine similarity
cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)

# Save the model and similarity matrix
import pickle

with open("tfidf_model.pkl", "wb") as f:
    pickle.dump(tfidf, f)

with open("cosine_sim.pkl", "wb") as f:
    pickle.dump(cosine_sim, f)

print("Model training completed successfully!")