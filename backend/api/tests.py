from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken

from .models import Note


class NoteApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="note-owner", password="password")
        self.other_user = User.objects.create_user(
            username="other-user", password="password"
        )
        self.list_url = reverse("note-list")

    def authenticate(self, user=None):
        token = AccessToken.for_user(user or self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_note_list_requires_a_valid_jwt(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.credentials(HTTP_AUTHORIZATION="Bearer invalid-token")
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_user_can_create_a_note(self):
        self.authenticate()

        response = self.client.post(
            self.list_url,
            {"title": "Test note", "content": "Created with JWT authentication."},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        note = Note.objects.get(pk=response.data["id"])
        self.assertEqual(note.author, self.user)

    def test_users_only_list_their_own_notes(self):
        own_note = Note.objects.create(
            title="Mine", content="Visible", author=self.user
        )
        Note.objects.create(
            title="Not mine", content="Hidden", author=self.other_user
        )
        self.authenticate()

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([note["id"] for note in response.data], [own_note.id])

    def test_users_can_only_delete_their_own_notes(self):
        own_note = Note.objects.create(
            title="Mine", content="Deletable", author=self.user
        )
        other_note = Note.objects.create(
            title="Not mine", content="Protected", author=self.other_user
        )
        self.authenticate()

        response = self.client.delete(reverse("delete-note", args=[other_note.id]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Note.objects.filter(pk=other_note.id).exists())

        response = self.client.delete(reverse("delete-note", args=[own_note.id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Note.objects.filter(pk=own_note.id).exists())
