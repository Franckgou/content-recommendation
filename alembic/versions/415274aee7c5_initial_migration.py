"""Initial migration

Revision ID: 415274aee7c5
Revises: 
Create Date: 2025-01-09 18:21:01.570387

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '415274aee7c5'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('movies', 'title',
               existing_type=sa.VARCHAR(length=100),
               nullable=True)
    op.alter_column('movies', 'description',
               existing_type=sa.TEXT(),
               type_=sa.String(),
               existing_nullable=True)
    op.alter_column('movies', 'rating',
               existing_type=sa.DOUBLE_PRECISION(precision=53),
               type_=sa.Integer(),
               existing_nullable=True)
    op.create_index(op.f('ix_movies_id'), 'movies', ['id'], unique=False)
    op.create_index(op.f('ix_movies_title'), 'movies', ['title'], unique=False)
    op.drop_column('movies', 'created_at')
    op.alter_column('user_interactions', 'user_id',
               existing_type=sa.INTEGER(),
               nullable=False)
    op.alter_column('user_interactions', 'movie_id',
               existing_type=sa.INTEGER(),
               nullable=False)
    op.create_index(op.f('ix_user_interactions_id'), 'user_interactions', ['id'], unique=False)
    op.alter_column('users', 'username',
               existing_type=sa.VARCHAR(length=50),
               nullable=True)
    op.alter_column('users', 'email',
               existing_type=sa.VARCHAR(length=100),
               nullable=True)
    op.alter_column('users', 'password',
               existing_type=sa.VARCHAR(length=100),
               nullable=True)
    op.drop_constraint('users_email_key', 'users', type_='unique')
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)
    op.drop_column('users', 'created_at')
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('users', sa.Column('created_at', postgresql.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), autoincrement=False, nullable=True))
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.create_unique_constraint('users_email_key', 'users', ['email'])
    op.alter_column('users', 'password',
               existing_type=sa.VARCHAR(length=100),
               nullable=False)
    op.alter_column('users', 'email',
               existing_type=sa.VARCHAR(length=100),
               nullable=False)
    op.alter_column('users', 'username',
               existing_type=sa.VARCHAR(length=50),
               nullable=False)
    op.drop_index(op.f('ix_user_interactions_id'), table_name='user_interactions')
    op.alter_column('user_interactions', 'movie_id',
               existing_type=sa.INTEGER(),
               nullable=True)
    op.alter_column('user_interactions', 'user_id',
               existing_type=sa.INTEGER(),
               nullable=True)
    op.add_column('movies', sa.Column('created_at', postgresql.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), autoincrement=False, nullable=True))
    op.drop_index(op.f('ix_movies_title'), table_name='movies')
    op.drop_index(op.f('ix_movies_id'), table_name='movies')
    op.alter_column('movies', 'rating',
               existing_type=sa.Integer(),
               type_=sa.DOUBLE_PRECISION(precision=53),
               existing_nullable=True)
    op.alter_column('movies', 'description',
               existing_type=sa.String(),
               type_=sa.TEXT(),
               existing_nullable=True)
    op.alter_column('movies', 'title',
               existing_type=sa.VARCHAR(length=100),
               nullable=False)
    # ### end Alembic commands ###
