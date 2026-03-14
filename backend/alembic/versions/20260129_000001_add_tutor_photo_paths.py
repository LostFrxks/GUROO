"""add tutor photo paths

Revision ID: 20260129_000001
Revises: e5b85795772f
Create Date: 2026-01-29
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260129_000001"
down_revision = "e5b85795772f"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "tutor_profiles",
        sa.Column("photo_paths", sa.JSON(), nullable=False, server_default=sa.text("'[]'::json")),
    )


def downgrade():
    op.drop_column("tutor_profiles", "photo_paths")
