"""
Tests for the GET /api/v1.0/documents/{id}/content/ endpoint.
"""

from uuid import uuid4

from django.core.files.storage import default_storage

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from core import factories
from core.tests.conftest import TEAM, USER, VIA

pytestmark = pytest.mark.django_db


@pytest.mark.parametrize("reach", ["authenticated", "restricted"])
def test_api_documents_content_retrieve_anonymous_non_public(reach):
    """Anonymous users cannot retrieve content of non-public documents."""
    document = factories.DocumentFactory(link_reach=reach)

    response = APIClient().get(f"/api/v1.0/documents/{document.id!s}/content/")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_api_documents_content_retrieve_anonymous_public():
    """Anonymous users can retrieve content of a public document."""
    document = factories.DocumentFactory(link_reach="public")

    response = APIClient().get(f"/api/v1.0/documents/{document.id!s}/content/")

    assert response.status_code == status.HTTP_200_OK
    assert response["Content-Type"] == "text/plain"
    assert b"".join(
        response.streaming_content
    ) == factories.YDOC_HELLO_WORLD_BASE64.encode("utf-8")


def test_api_documents_content_retrieve_authenticated_no_access():
    """Authenticated users without access cannot retrieve content of a restricted document."""
    user = factories.UserFactory()
    document = factories.DocumentFactory(link_reach="restricted")

    client = APIClient()
    client.force_login(user)

    response = client.get(f"/api/v1.0/documents/{document.id!s}/content/")

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.parametrize("link_reach", ["authenticated", "public"])
def test_api_documents_content_retrieve_authenticated_not_restricted(link_reach):
    """
    Authenticated users can retrieve content of a public document
    without any explicit access grant.
    """
    user = factories.UserFactory()
    document = factories.DocumentFactory(link_reach=link_reach)

    client = APIClient()
    client.force_login(user)

    response = client.get(f"/api/v1.0/documents/{document.id!s}/content/")

    assert response.status_code == status.HTTP_200_OK
    assert b"".join(
        response.streaming_content
    ) == factories.YDOC_HELLO_WORLD_BASE64.encode("utf-8")


@pytest.mark.parametrize("via", VIA)
@pytest.mark.parametrize(
    "role", ["reader", "commenter", "editor", "administrator", "owner"]
)
def test_api_documents_content_retrieve_success(role, via, mock_user_teams):
    """Users with any role can retrieve document content, directly or via a team."""
    user = factories.UserFactory()
    document = factories.DocumentFactory(link_reach="restricted")

    if via == USER:
        factories.UserDocumentAccessFactory(document=document, user=user, role=role)
    elif via == TEAM:
        mock_user_teams.return_value = ["lasuite"]
        factories.TeamDocumentAccessFactory(
            document=document, team="lasuite", role=role
        )

    client = APIClient()
    client.force_login(user)

    response = client.get(f"/api/v1.0/documents/{document.id!s}/content/")

    assert response.status_code == status.HTTP_200_OK
    assert b"".join(
        response.streaming_content
    ) == factories.YDOC_HELLO_WORLD_BASE64.encode("utf-8")


def test_api_documents_content_retrieve_nonexistent_document():
    """Retrieving content of a non-existent document returns 404."""
    user = factories.UserFactory()
    client = APIClient()
    client.force_login(user)

    response = client.get(f"/api/v1.0/documents/{uuid4()!s}/content/")

    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_api_documents_content_retrieve_file_not_in_storage():
    """Returns 404 when the document's file does not exist in storage."""
    user = factories.UserFactory()
    document = factories.DocumentFactory(link_reach="restricted")
    factories.UserDocumentAccessFactory(document=document, user=user, role="reader")

    client = APIClient()
    client.force_login(user)

    default_storage.delete(document.file_key)

    assert not default_storage.exists(document.file_key)

    response = client.get(f"/api/v1.0/documents/{document.id!s}/content/")

    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_api_documents_content_retrieve_content_length_header():
    """The response includes the Content-Length header when available from storage."""
    user = factories.UserFactory()
    document = factories.DocumentFactory(link_reach="restricted")
    factories.UserDocumentAccessFactory(document=document, user=user, role="reader")

    client = APIClient()
    client.force_login(user)

    response = client.get(f"/api/v1.0/documents/{document.id!s}/content/")

    assert response.status_code == status.HTTP_200_OK
    expected_size = default_storage.size(document.file_key)
    assert int(response["Content-Length"]) == expected_size


@pytest.mark.parametrize("role", ["reader", "commenter", "editor", "administrator"])
def test_api_documents_content_retrieve_deleted_document_for_non_owners_all_roles(role):
    """
    Retrieving content of a soft-deleted document returns 404 for any non-owner role.
    """
    user = factories.UserFactory()
    document = factories.DocumentFactory(link_reach="restricted")
    factories.UserDocumentAccessFactory(document=document, user=user, role=role)

    document.soft_delete()
    document.refresh_from_db()

    client = APIClient()
    client.force_login(user)

    response = client.get(f"/api/v1.0/documents/{document.id!s}/content/")

    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_api_documents_content_retrieve_deleted_document_for_owner():
    """
    Owners can still retrieve content of a soft-deleted document.

    The 'retrieve' ability is True for owners regardless of deletion state.
    """
    user = factories.UserFactory()
    document = factories.DocumentFactory(link_reach="restricted")
    factories.UserDocumentAccessFactory(document=document, user=user, role="owner")

    document.soft_delete()
    document.refresh_from_db()

    client = APIClient()
    client.force_login(user)

    response = client.get(f"/api/v1.0/documents/{document.id!s}/content/")

    assert response.status_code == status.HTTP_200_OK
    assert b"".join(
        response.streaming_content
    ) == factories.YDOC_HELLO_WORLD_BASE64.encode("utf-8")
