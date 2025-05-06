import React, { useEffect, useState } from "react";
import axios from "axios";
import { MovieCard } from "./Home";
import { useNavigate, Link } from "react-router-dom";
import "./Home.css"; // Import Home.css to use the same styling

const Profile = () => {
  const [likedMovies, setLikedMovies] = useState([]);
  const [watchLaterMovies, setWatchLaterMovies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated properly
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId || userId === "null" || userId === "undefined") {
      // Redirect to login if not authenticated
      navigate("/login", {
        state: { message: "Please log in to view your profile" },
      });
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoading(true);

        // Fetch user details
        try {
          const userResponse = await axios.get(
            `http://localhost:5000/user/${userId}`
          );
          setUsername(userResponse.data.username);
        } catch (userError) {
          console.error("Error fetching user details:", userError);
          setUsername("Movie Fan");
        }

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
        try {
          const recommendationsResponse = await axios.get(
            `http://localhost:5000/recommendations?userId=${userId}`
          );
          setRecommendations(recommendationsResponse.data);
        } catch (recError) {
          console.error("Error fetching recommendations:", recError);
          // Continue with other data even if recommendations fail
          setRecommendations([]);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("Failed to fetch user data. Please try again later.");
        setLoading(false);
      }
    };

    fetchUserData();
  }, [refreshTrigger, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your profile data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Oops!</h2>
        <p>{error}</p>
        <button onClick={() => navigate("/")} className="auth-button profile">
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="logo-container">
          <h1>TasteDive</h1>
        </div>
        <div className="welcome-message">
          <h2>Welcome back, {username}!</h2>
        </div>
        <div className="auth-buttons">
          <Link to="/" className="auth-button profile">
            <i className="fas fa-home"></i> Home
          </Link>
          <button className="auth-button logout" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </nav>

      <div className="profile-page">
        {recommendations.length > 0 && (
          <div className="movies-section recommendations-section">
            <div className="section-header">
              <h2>
                <i className="fas fa-star"></i> Recommended For You
              </h2>
            </div>
            <div className="movie-grid">
              {recommendations.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  isLoggedIn={true}
                  isHighlighted={true}
                />
              ))}
            </div>
          </div>
        )}

        <div className="movies-section">
          <div className="section-header">
            <h2>
              <i className="fas fa-heart"></i> Your Liked Movies
            </h2>
          </div>
          <div className="movie-grid">
            {likedMovies.length > 0 ? (
              likedMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  isLoggedIn={true}
                  isHighlighted={false}
                />
              ))
            ) : (
              <p className="no-movies">
                You haven't liked any movies yet. Start exploring!
              </p>
            )}
          </div>
        </div>

        <div className="movies-section">
          <div className="section-header">
            <h2>
              <i className="fas fa-clock"></i> Watch Later
            </h2>
          </div>
          <div className="movie-grid">
            {watchLaterMovies.length > 0 ? (
              watchLaterMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  isLoggedIn={true}
                  isHighlighted={false}
                />
              ))
            ) : (
              <p className="no-movies">
                Your watch later list is empty. Add movies to watch later!
              </p>
            )}
          </div>
        </div>

        {likedMovies.length === 0 &&
          watchLaterMovies.length === 0 &&
          recommendations.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">
                <i className="fas fa-film"></i>
              </div>
              <h3>Your movie collections are empty</h3>
              <p>Start exploring movies and hit like on your favorites!</p>
              <Link to="/" className="auth-button profile">
                Explore Movies
              </Link>
            </div>
          )}
      </div>
    </div>
  );
};

export default Profile;
