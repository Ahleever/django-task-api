from django.db import models
from django.conf import settings
from django.contrib.auth.models import User

class Team(models.Model):
    name = models.CharField(max_length=100)
    # One manager per team
    manager = models.OneToOneField(User, on_delete=models.CASCADE, related_name='managed_team')
    # Many members in a team
    members = models.ManyToManyField(User, related_name='teams', blank=True)

    def __str__(self):
        return self.name

class Task(models.Model):
    # Link the task to a specific user.
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='assigned_tasks')
    assigned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='assigned_tasks_by')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    due_date = models.DateField(blank=True, null=True)
    is_complete = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    PRIORITY_CHOICES = [
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
    ]
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='Medium')

    def __str__(self):
        return self.title