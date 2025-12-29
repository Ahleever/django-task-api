from rest_framework import serializers
from .models import Task
from django.contrib.auth.models import User

class TaskSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='owner.username')
    assign_to = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'is_complete', 'created_at', 'username', 'assign_to']

    def update(self, instance, validated_data):
        new_owner_username = validated_data.pop('assign_to', None)
        if new_owner_username:
            try:
                user = User.objects.get(username=new_owner_username)
                instance.owner = user
            except User.DoesNotExist:
                raise serializers.ValidationError({"assign_to": "User not found."})

        return super().update(instance, validated_data)

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password']
        )
        return user
    
class UserListSerializer(serializers.ModelSerializer):
    manager = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'manager', 'is_staff']
    
    def get_manager(self, obj):
        try:
            if hasattr(obj, 'teams'):
                team = obj.teams.first() 
                if team and team.manager:
                    return team.manager.username
        except Exception:
            pass
        return None