from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy import UniqueConstraint

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)

    # Relationships
    interactions = relationship("UserInteraction", back_populates="user")

class Movie(Base):
    __tablename__ = "movies"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    genre = Column(String)
    rating = Column(Integer)
    release_year = Column(Integer)
    poster_url = Column(String)

    # Relationships
    interactions = relationship("UserInteraction", back_populates="movie")

class UserInteraction(Base):
    __tablename__ = "user_interactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    movie_id = Column(Integer, ForeignKey("movies.id"), nullable=False)
    liked = Column(Boolean, default=False)
    watch_later = Column(Boolean, default=False)
    created_at = Column(DateTime, default="CURRENT_TIMESTAMP")

    __table_args__ = (
        UniqueConstraint('user_id', 'movie_id', name='unique_user_movie'),
    )

    # Relationships
    user = relationship("User", back_populates="interactions")
    movie = relationship("Movie", back_populates="interactions")