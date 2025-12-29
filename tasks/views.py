# tasks/views.py
from rest_framework import viewsets, permissions, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Task, Team
from .serializers import TaskSerializer, UserRegistrationSerializer, UserListSerializer
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated] 

    # Users can only see their own tasks, and they are ordered by creation date
    def get_queryset(self):
        user = self.request.user
        
        # Default: You see your own tasks
        queryset = Task.objects.filter(owner=user)

        # Check if the user is a team manager
        if hasattr(user, 'managed_team'):
            team = user.managed_team
            members = team.members.all()
            team_tasks = Task.objects.filter(owner__in=members)
            queryset = queryset | team_tasks

        return queryset.distinct()

    # When creating a new task, set the owner to the current user
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]  # Allow anyone to register a new user

class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserListSerializer
    permission_classes = [permissions.IsAdminUser]  # Only admin users can access this viewset  

    def get_serializer_class(self):
        if self.action == 'create':
            return UserRegistrationSerializer
        return UserListSerializer
    
    @action(detail=False, methods=['post'])
    def assign_manager(self, request):
        member_username = request.data.get('member')
        manager_username = request.data.get('manager')

        if not member_username or not manager_username:
            return Response({'error': 'Missing data'}, status=400)

        member = get_object_or_404(User, username=member_username)
        manager = get_object_or_404(User, username=manager_username)

        member.teams.clear()

        team, created = Team.objects.get_or_create(
            manager=manager, 
            defaults={'name': f"{manager.username}'s Team"}
        )
        team.members.add(member)

        return Response({'status': 'success', 'message': f'{member.username} is now managed by {manager.username}'})