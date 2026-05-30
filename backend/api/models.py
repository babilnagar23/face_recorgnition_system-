from django.db import models


class Employee(models.Model):
    employee_id = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255)

    # Store face embeddings as JSON text
    face_embedding = models.JSONField(
        default=list,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class AttendanceLog(models.Model):
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE
    )

    timestamp = models.DateTimeField()

    is_verified = models.BooleanField(default=False)

    device_id = models.CharField(max_length=255)

    synced = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.employee.name} - {self.timestamp}"