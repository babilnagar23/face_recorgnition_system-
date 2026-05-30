from rest_framework import serializers
from .models import Employee, AttendanceLog


class EmployeeSerializer(serializers.ModelSerializer):

    class Meta:
        model = Employee
        fields = [
            "id",
            "employee_id",
            "name",
            "created_at",
        ]

    def create(self, validated_data):
        if "face_embedding" not in validated_data:
            validated_data["face_embedding"] = []

        return super().create(validated_data)


class AttendanceLogSerializer(serializers.ModelSerializer):

    class Meta:
        model = AttendanceLog
        fields = '__all__'


from rest_framework import serializers

class FaceRegisterSerializer(serializers.Serializer):
    employee_id = serializers.CharField()
    image = serializers.ImageField()
    
class FaceLoginSerializer(
    serializers.Serializer
):
    employee_id = serializers.CharField()
    image = serializers.ImageField()