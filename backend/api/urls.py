from django.urls import path


from .views import (
    register_employee,
    get_employees,
    create_attendance,
    get_attendance_logs,
    register_face,
    login_face
    
)

urlpatterns = [

    path(
        'register/',
        register_employee
    ),

    path(
        'employees/',
        get_employees
    ),

    path(
        'attendance/create/',
        create_attendance
    ),

    path(
        'attendance/logs/',
        get_attendance_logs
    ),

    path(
        'face/register/',
        register_face
    ),
    
    path(
       'face/login/',
       login_face
    ),
]