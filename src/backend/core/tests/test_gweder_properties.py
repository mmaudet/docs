"""
Tests for the gweder_properties field on the Document model.
"""

import pytest

from core import factories, models

pytestmark = pytest.mark.django_db


def test_gweder_properties_default_null():
    """The gweder_properties field should default to None."""
    document = factories.DocumentFactory()
    assert document.gweder_properties is None


def test_gweder_properties_stores_json():
    """The gweder_properties field should store and retrieve JSON data correctly."""
    props = {
        "ref": "NOTE-2025-001",
        "date": "2025-04-07",
        "audience": ["LINAGORA", "ANFSI"],
    }
    document = factories.DocumentFactory(gweder_properties=props)
    document.refresh_from_db()
    assert document.gweder_properties["ref"] == "NOTE-2025-001"
    assert document.gweder_properties["audience"] == ["LINAGORA", "ANFSI"]


def test_gweder_properties_update():
    """The gweder_properties field should be updatable."""
    document = factories.DocumentFactory()
    document.gweder_properties = {"ref": "UPDATED"}
    document.save()
    document.refresh_from_db()
    assert document.gweder_properties["ref"] == "UPDATED"


def test_gweder_properties_null_via_add_root():
    """A document created via add_root without gweder_properties should have it as None."""
    creator = factories.UserFactory()
    document = models.Document.add_root(title="Test doc", creator=creator)
    assert document.gweder_properties is None


def test_gweder_properties_stores_complex_json():
    """The gweder_properties field should handle nested and varied JSON structures."""
    props = {
        "ref": "CIRC-2025-042",
        "date": "2025-04-07",
        "audience": ["DGNUM", "DINUM"],
        "metadata": {
            "classification": "internal",
            "version": 3,
            "tags": ["urgent", "review"],
        },
    }
    document = factories.DocumentFactory(gweder_properties=props)
    document.refresh_from_db()
    assert document.gweder_properties["ref"] == "CIRC-2025-042"
    assert document.gweder_properties["metadata"]["classification"] == "internal"
    assert document.gweder_properties["metadata"]["version"] == 3
    assert "urgent" in document.gweder_properties["metadata"]["tags"]
