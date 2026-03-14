"""add tutor declined_until cooldown

Revision ID: 20260131_000002
Revises: 20260129_000001
Create Date: 2026-01-31
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260131_000002"
down_revision = "20260129_000001"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "tutor_students",
        sa.Column("declined_until", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade():
    op.drop_column("tutor_students", "declined_until")
