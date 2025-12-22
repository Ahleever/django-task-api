# tasks/views.py
from rest_framework import viewsets, permissions
from .models import Task
from .serializers import TaskSerializer

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated] # Lock it down!

    # Users can only see their own tasks, and they are ordered by creation date
    def get_queryset(self):
        return Task.objects.filter(owner=self.request.user).order_by('-created_at')

    # When creating a new task, set the owner to the current user
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)