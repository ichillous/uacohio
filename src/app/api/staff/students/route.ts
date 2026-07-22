import { getD1Database } from "@/db/d1";
import { getSession } from "@/modules/auth/session";
import { createStudent, listStudents } from "@/modules/staff/students/repository";
import { createStudentSchema, listStudentsQuerySchema } from "@/modules/staff/students/schemas";
import {
  fieldErrorsFromIssues,
  parseJson,
  privateJson,
  requireSameOrigin,
  StaffApiError,
  staffErrorResponse,
} from "@/modules/staff/shared/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const query = listStudentsQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    if (!query.success) {
      throw new StaffApiError(
        400,
        "INVALID_REQUEST",
        "Review the search filters.",
        fieldErrorsFromIssues(query.error.issues),
      );
    }
    const data = await listStudents(await getD1Database(), await getSession(), query.data);
    return privateJson({ data, meta: { count: data.length } });
  } catch (error) {
    return staffErrorResponse(error, request);
  }
}

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const input = await parseJson(request, createStudentSchema);
    const data = await createStudent(await getD1Database(), await getSession(), input);
    return privateJson({ data }, 201);
  } catch (error) {
    return staffErrorResponse(error, request);
  }
}
