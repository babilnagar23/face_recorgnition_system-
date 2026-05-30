import os
import tempfile

from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import parser_classes

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .face_matcher import match_faces
from .serializers import FaceLoginSerializer

from .models import Employee, AttendanceLog
from .serializers import (
    EmployeeSerializer,
    AttendanceLogSerializer,
    FaceRegisterSerializer,
)

from .face_service import get_embedding


# REGISTER EMPLOYEE
@api_view(['POST'])
def register_employee(request):

    serializer = EmployeeSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )


# GET ALL EMPLOYEES
@api_view(['GET'])
def get_employees(request):

    employees = Employee.objects.all()

    serializer = EmployeeSerializer(
        employees,
        many=True
    )

    return Response(serializer.data)


# CREATE ATTENDANCE LOG
@api_view(['POST'])
def create_attendance(request):

    serializer = AttendanceLogSerializer(
        data=request.data
    )

    if serializer.is_valid():
        serializer.save()

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )


# REGISTER FACE
@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def register_face(request):

    serializer = FaceRegisterSerializer(
        data=request.data
    )

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    employee_id = serializer.validated_data[
        'employee_id'
    ]

    image = serializer.validated_data[
        'image'
    ]

    try:
        employee = Employee.objects.get(
            employee_id=employee_id
        )

    except Employee.DoesNotExist:
        return Response(
            {
                "error": "Employee not found"
            },
            status=status.HTTP_404_NOT_FOUND
        )

    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=".jpg"
    ) as temp_file:

        for chunk in image.chunks():
            temp_file.write(chunk)

        temp_path = temp_file.name

    try:
        embedding = get_embedding(temp_path)

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

    if embedding is None:
        return Response(
            {
                "error": "No face detected"
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if employee.face_embedding:
        return Response(
            {
                "error": "Face already registered"
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    employee.face_embedding = embedding
    employee.save()

    return Response(
        {
            "message": "Face Registered Successfully",
            "embedding_length": len(embedding)
        },
        status=status.HTTP_200_OK
    )


# GET ALL ATTENDANCE LOGS
@api_view(['GET'])
def get_attendance_logs(request):

    logs = AttendanceLog.objects.all()

    serializer = AttendanceLogSerializer(
        logs,
        many=True
    )

    return Response(serializer.data)


# FACE LOGIN
@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def login_face(request):

    serializer = FaceLoginSerializer(
        data=request.data
    )

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=400
        )

    employee_id = serializer.validated_data[
        'employee_id'
    ]

    image = serializer.validated_data[
        'image'
    ]

    try:
        employee = Employee.objects.get(
            employee_id=employee_id
        )
    except Employee.DoesNotExist:
        return Response(
            {"error": "Employee not found"},
            status=404
        )

    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=".jpg"
    ) as temp_file:

        for chunk in image.chunks():
            temp_file.write(chunk)

        temp_path = temp_file.name

    try:
        embedding = get_embedding(
            temp_path
        )
    finally:
        os.remove(temp_path)

    if embedding is None:
        return Response(
            {"error": "No face detected"},
            status=400
        )

    if not employee.face_embedding:
        return Response(
            {"error": "Face not registered"},
            status=400
        )

    matched, score = match_faces(
        employee.face_embedding,
        embedding
    )

    return Response({
        "authenticated": matched,
        "similarity": score
    })
