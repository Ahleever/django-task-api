from django.db import models
from django.contrib.auth.models import User

class Task(models.Model):
    # Link the task to a specific user.
    # on_delete=models.CASCADE means if the User is deleted, delete their tasks too.
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    is_complete = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title