import "./Home.css";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const Home = () => {
  const [popularMovies, setPopularMovies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [allMovies, setAllMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("popular");

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);
    };

    const fetchData = async () => {
      try {
        // Fetch all movies first
        const allMoviesResponse = await axios.get(
          "http://localhost:5000/movies"
        );
        setAllMovies(allMoviesResponse.data);

        // Fetch popular movies
        const popularResponse = await axios.get(
          "http://localhost:5000/movies/popular"
        );
        setPopularMovies(popularResponse.data);

        // Fetch recommendations if logged in
        if (isLoggedIn) {
          const userId = localStorage.getItem("userId");
          try {
            const recommendationsResponse = await axios.get(
              `http://localhost:5000/recommendations?userId=${userId}`
            );
            setRecommendations(recommendationsResponse.data);
            // Set active tab to recommendations for logged-in users with recommendations
            if (recommendationsResponse.data.length > 0) {
              setActiveTab("recommendations");
            }
          } catch (recError) {
            console.error("Error fetching recommendations:", recError);
            // If recommendations fail, keep showing popular movies
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    checkAuth();
    fetchData();
  }, [isLoggedIn]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading movies...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <h1>TasteDive</h1>
        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === "popular" ? "active" : ""}`}
            onClick={() => setActiveTab("popular")}
          >
            Most Popular
          </button>

          {isLoggedIn && recommendations.length > 0 && (
            <button
              className={`tab-button ${
                activeTab === "recommendations" ? "active" : ""
              }`}
              onClick={() => setActiveTab("recommendations")}
            >
              For You
            </button>
          )}

          <button
            className={`tab-button ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All Movies
          </button>
        </div>
        <div className="auth-buttons">
          {!isLoggedIn ? (
            <>
              <Link to="/login" className="auth-button login">
                Login
              </Link>
              <Link to="/signup" className="auth-button signup">
                Sign Up
              </Link>
            </>
          ) : (
            <>
              <Link to="/profile" className="auth-button profile">
                Profile
              </Link>
              <button
                className="auth-button logout"
                onClick={() => {
                  localStorage.removeItem("token");
                  localStorage.removeItem("userId");
                  setIsLoggedIn(false);
                  setActiveTab("popular");
                }}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </nav>

      {activeTab === "popular" && (
        <div className="movies-section popular-section">
          <h2>Most Popular Films</h2>
          <div className="movie-grid">
            {popularMovies.length > 0 ? (
              popularMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  isLoggedIn={isLoggedIn}
                  isHighlighted={true}
                />
              ))
            ) : (
              <p className="no-movies">No popular movies found</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "recommendations" && isLoggedIn && (
        <div className="movies-section recommendations-section">
          <h2>Recommended For You</h2>
          <div className="movie-grid">
            {recommendations.length > 0 ? (
              recommendations.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  isLoggedIn={isLoggedIn}
                  isHighlighted={true}
                />
              ))
            ) : (
              <p className="no-movies">
                No recommendations yet. Start liking movies!
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === "all" && (
        <div className="movies-section all-movies-section">
          <h2>All Movies</h2>
          <div className="movie-grid">
            {allMovies.length > 0 ? (
              allMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  isLoggedIn={isLoggedIn}
                  isHighlighted={false}
                />
              ))
            ) : (
              <p className="no-movies">No movies in the catalog</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const MovieCard = ({ movie, isLoggedIn, isHighlighted }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isWatchLater, setIsWatchLater] = useState(false);
  const [message, setMessage] = useState("");
  const [interactions, setInteractions] = useState(null);

  // Fetch initial state from API when component mounts
  useEffect(() => {
    const fetchInteraction = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const response = await axios.get(
          `http://localhost:5000/movies/${movie.id}/interaction`,
          { params: { userId } }
        );
        const data = response.data;
        setIsLiked(data.liked);
        setIsDisliked(data.disliked);
        setIsWatchLater(data.watch_later);
        setInteractions(data);
      } catch (error) {
        console.error("Error fetching interaction:", error);
      }
    };

    if (isLoggedIn) fetchInteraction();
  }, [isLoggedIn, movie.id]);

  const handleInteraction = async (type) => {
    if (!isLoggedIn) {
      setMessage("Please log in to interact with movies");
      setTimeout(() => setMessage(""), 2000);
      return;
    }

    let previousState = { isLiked, isDisliked, isWatchLater };

    try {
      const userId = localStorage.getItem("userId");

      // Optimistic UI update
      switch (type) {
        case "like":
          setIsLiked(true);
          setIsDisliked(false);
          break;
        case "dislike":
          setIsDisliked(true);
          setIsLiked(false);
          break;
        case "watch-later":
          setIsWatchLater(!isWatchLater);
          break;
        default:
          // Handle unexpected types
          break;
      }

      const response = await axios.post(
        `http://localhost:5000/movies/${movie.id}/${type}`,
        { userId }
      );

      setMessage(response.data.message);
      setTimeout(() => setMessage(""), 2000);
    } catch (error) {
      console.error("Interaction error:", error);
      // Rollback on error using the captured previous state
      setIsLiked(previousState.isLiked);
      setIsDisliked(previousState.isDisliked);
      setIsWatchLater(previousState.isWatchLater);
      setMessage(error.response?.data?.message || "Action failed");
      setTimeout(() => setMessage(""), 2000);
    }
  };

  const cardClasses = `movie-card ${isHighlighted ? "highlighted" : ""}`;

  return (
    <div className={cardClasses}>
      <div className="poster-container">
        <img
          src={movie.poster_url}
          alt={movie.title}
          className="movie-poster"
        />
        {isHighlighted && <div className="popular-badge">🔥 Popular</div>}
      </div>
      <div className="movie-info">
        <h3>
          {movie.title} {movie.release_year && `(${movie.release_year})`}
        </h3>
        <div className="movie-meta">
          <p className="genre">{movie.genre}</p>
          <p className="rating">★ {movie.rating || "N/A"}</p>
        </div>
        <p className="description">{movie.description}</p>
        {message && <div className="action-message">{message}</div>}
        <div className="action-buttons">
          <button
            className={`action-btn like-btn ${isLiked ? "active" : ""}`}
            onClick={() => handleInteraction("like")}
          >
            <span className="btn-icon">👍</span> {isLiked ? "Liked" : "Like"}
          </button>
          <button
            className={`action-btn dislike-btn ${isDisliked ? "active" : ""}`}
            onClick={() => handleInteraction("dislike")}
          >
            <span className="btn-icon">👎</span>{" "}
            {isDisliked ? "Disliked" : "Dislike"}
          </button>
          <button
            className={`action-btn watch-later-btn ${
              isWatchLater ? "active" : ""
            }`}
            onClick={() => handleInteraction("watch-later")}
          >
            <span className="btn-icon">{isWatchLater ? "✓" : "+"}</span>{" "}
            {isWatchLater ? "Saved" : "Watch Later"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
export { MovieCard };
