import { TEnrolledCourse } from './enrolledCourse.interface';
import { OfferedCourse } from '../offeredCourse/OfferedCourseModel';
import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import EnrolledCourse from './enrolledCourse.model';
import { Student } from '../student/student.model';
import mongoose from 'mongoose';
import { SemesterRegistration } from '../semesterRegistration/semesterRegistration.model';

const createEnrolledCourseIntoDB = async (
  userId: string,
  payload: TEnrolledCourse,
) => {
  const { offeredCourse } = payload;

  const isOfferedCourseExists = await OfferedCourse.findById(offeredCourse);

  if (!isOfferedCourseExists) {
    throw new AppError(httpStatus.NOT_FOUND, 'Offered course not found !');
  }

  if (isOfferedCourseExists.maxCapacity <= 0) {
    throw new AppError(httpStatus.BAD_GATEWAY, 'Room is full !');
  }

  const student = await Student.findOne({ id: userId }, { _id: 1 });

  if (!student) {
    throw new AppError(httpStatus.NOT_FOUND, 'Student not found !');
  }

  const isStudentAlreadyEnrolled = await EnrolledCourse.findOne({
    semesterRegistration: isOfferedCourseExists?.semesterRegistration,
    offeredCourse,
    student: student?._id,
  });

  if (isStudentAlreadyEnrolled) {
    throw new AppError(httpStatus.CONFLICT, 'Student is already enrolled !');
  }

  const semesterRegistration = SemesterRegistration.findById(
    isOfferedCourseExists.semesterRegistration,
  ).select('maxCredit');

  const enrolledCourses = await EnrolledCourse.aggregate([
    {
      $match: {
        semesterRegistrationRoutes: isOfferedCourseExists.semesterRegistration,
        student: student._id,
      },
    },
    // {
    //   $lookup: {
    //     from: 'courses',
    //     localField: 'course',
    //     foreignField: '_id',
    //     as: 'enrolledCourseData',
    //   },
    // },
  ]);

  console.log(enrolledCourses);

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const result = await EnrolledCourse.create(
      [
        {
          semesterRegistration: isOfferedCourseExists.semesterRegistration,
          academicSemester: isOfferedCourseExists.academicSemester,
          academicFaculty: isOfferedCourseExists.academicFaculty,
          academicDepartment: isOfferedCourseExists.academicDepartment,
          offeredCourse: offeredCourse,
          course: isOfferedCourseExists.course,
          student: student._id,
          faculty: isOfferedCourseExists.faculty,
          isEnrolled: true,
        },
      ],
      { session },
    );

    if (!result) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'faild to enrolled in this course !',
      );
    }

    const maxCapacity = isOfferedCourseExists.maxCapacity;
    await OfferedCourse.findByIdAndUpdate(offeredCourse, {
      maxCapacity: maxCapacity - 1,
    });

    await session.commitTransaction();
    await session.endSession();

    return result;
  } catch (err: any) {
    await session.abortTransaction();
    await session.endSession();
    throw new Error(err);
  }
};

const updateEnrolledCourseMarksIntoDB = async () => {};

export const EnrolledCourseServices = {
  createEnrolledCourseIntoDB,
  updateEnrolledCourseMarksIntoDB,
};
