"""Create corpora table

Revision ID: 5f672fc43120
Revises: 
Create Date: 2025-06-27 10:55:39.518431

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5f672fc43120'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('corpora',
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('description', sa.Text(), nullable=False),
    sa.Column('default_prompt', sa.Text(), nullable=False),
    sa.Column('qdrant_collection_name', sa.String(length=255), nullable=False),
    sa.Column('path', sa.String(length=500), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_corpora_name', 'corpora', ['name'])
    
    # Create corpus_files table
    op.create_table('corpus_files',
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('corpus_id', sa.String(length=36), nullable=False),
    sa.Column('filename', sa.String(length=255), nullable=False),
    sa.Column('is_ingested', sa.Boolean(), nullable=False, default=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.ForeignKeyConstraint(['corpus_id'], ['corpora.id'], ondelete='CASCADE')
    )
    op.create_index('ix_corpus_files_corpus_id', 'corpus_files', ['corpus_id'])
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index('ix_corpus_files_corpus_id', table_name='corpus_files')
    op.drop_table('corpus_files')
    op.drop_index('ix_corpora_name', table_name='corpora')
    op.drop_table('corpora')
    # ### end Alembic commands ###
