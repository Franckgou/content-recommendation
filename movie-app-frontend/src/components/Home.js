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
          const recommendationsResponse = await axios.get(
            `http://localhost:5000/recommendations?userId=${userId}`
          );
          setRecommendations(recommendationsResponse.data);
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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <h1>TasteDive</h1>
        <div className="auth-buttons">
          {!isLoggedIn ? (
            <Link to="/login" className="auth-button">
              Login
            </Link>
          ) : (
            <Link to="/profile" className="auth-button">
              Profile
            </Link>
          )}
        </div>
      </nav>

      {isLoggedIn ? (
        <div className="recommendations-section">
          <h2>Personalized Recommendations</h2>
          <div className="movie-grid">
            {recommendations.length > 0 ? (
              recommendations.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  isLoggedIn={isLoggedIn}
                />
              ))
            ) : (
              <p>No recommendations yet. Start liking movies!</p>
            )}
          </div>
        </div>
      ) : (
        <div className="popular-section">
          <h2>Most Loved by Our Community</h2>
          <div className="movie-grid">
            {popularMovies.length > 0 ? (
              popularMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  isLoggedIn={isLoggedIn}
                />
              ))
            ) : (
              <p>No popular movies found</p>
            )}
          </div>
        </div>
      )}

      <div className="movie-catalog">
        <h2>Movie Catalog</h2>
        <div className="movie-grid">
          {allMovies.length > 0 ? (
            allMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} isLoggedIn={isLoggedIn} />
            ))
          ) : (
            <p>No movies in the catalog</p>
          )}
        </div>
      </div>
    </div>
  );
};

const MovieCard = ({ movie, isLoggedIn }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isWatchLater, setIsWatchLater] = useState(false);
  const [message, setMessage] = useState("");

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
      } catch (error) {
        console.error("Error fetching interaction:", error);
      }
    };

    if (isLoggedIn) fetchInteraction();
  }, [isLoggedIn, movie.id]);

  const handleInteraction = async (type) => {
    let previousState = { isLiked, isDisliked, isWatchLater };

    try {
      const userId = localStorage.getItem("userId");

      // Optimistic UI update
      switch (type) {
        case "like":
          setIsLiked(true);
          setIsDisliked(false);
          setIsWatchLater(false);
          break;
        case "dislike":
          setIsDisliked(true);
          setIsLiked(false);
          setIsWatchLater(false);
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

  return (
    <div className="movie-card">
      <img src={movie.poster_url} alt={movie.title} className="movie-poster" />
      <div className="movie-info">
        <h3>
          {movie.title} ({movie.release_year})
        </h3>
        <p className="genre">{movie.genre}</p>
        <p className="rating">★ {movie.rating}</p>
        <p className="description">{movie.description}</p>
        {message && <div className="action-message">{message}</div>}
        {isLoggedIn && (
          <div className="action-buttons">
            <button
              className={`action-btn like-btn ${isLiked ? "active" : ""}`}
              onClick={() => handleInteraction("like")}
            >
              {isLiked ? "Liked" : "Like"}
            </button>
            <button
              className={`action-btn dislike-btn ${isDisliked ? "active" : ""}`}
              onClick={() => handleInteraction("dislike")}
            >
              {isDisliked ? "Disliked" : "Dislike"}
            </button>
            <button
              className={`action-btn watch-later-btn ${
                isWatchLater ? "active" : ""
              }`}
              onClick={() => handleInteraction("watch-later")}
            >
              {isWatchLater ? "Saved" : "Watch Later"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
export { MovieCard };
