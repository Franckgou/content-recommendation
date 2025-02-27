import React, { useEffect, useState } from "react";
import axios from "axios";
// Add this import at the top
// Change the import in Profile.js
import { MovieCard } from "./Home";

const Profile = () => {
  const [likedMovies, setLikedMovies] = useState([]);
  const [watchLaterMovies, setWatchLaterMovies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = localStorage.getItem("userId");

        // Fetch liked movies
        const likedResponse = await axios.get(
          `http://localhost:5000/user/${userId}/liked-movies`
        );
        setLikedMovies(likedResponse.data);

        // Fetch watch later movies
        const watchLaterResponse = await axios.get(
          `http://localhost:5000/user/${userId}/watch-later`
        );
        setWatchLaterMovies(watchLaterResponse.data);

        // Fetch recommended movies
        const recommendationsResponse = await axios.get(
          `http://localhost:5000/recommendations?userId=${userId}`
        );
        setRecommendations(recommendationsResponse.data);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("Failed to fetch user data. Please try again later.");
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="profile-page">
      <h1>Your Movie Profile</h1>

      <div className="profile-section">
        <h2>Your Liked Movies</h2>
        <div className="movie-grid">
          {likedMovies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              isLoggedIn={true}
              handleLike={() => {}}
              handleDislike={() => {}}
              handleWatchLater={() => {}}
            />
          ))}
        </div>
      </div>

      <div className="profile-section">
        <h2>Your Recommendations</h2>
        <div className="movie-grid">
          {recommendations.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              isLoggedIn={true}
              handleLike={() => {}}
              handleDislike={() => {}}
              handleWatchLater={() => {}}
            />
          ))}
        </div>
      </div>

      <div className="profile-section">
        <h2>Watch Later</h2>
        <div className="movie-grid">
          {watchLaterMovies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              isLoggedIn={true}
              handleLike={() => {}}
              handleDislike={() => {}}
              handleWatchLater={() => {}}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
// Add at the end of Profile.js
export default Profile;
