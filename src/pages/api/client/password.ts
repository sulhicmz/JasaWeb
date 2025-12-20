/**
 * Change Password API
 */
import type { APIRoute } from 'astro';
import { getPrisma } from '@/lib/prisma';
import { verifyPassword, hashPassword } from '@/lib/auth';
import { jsonResponse, errorResponse, handleApiError, parseBody, validateRequired } from '@/lib/api';

export const PUT: APIRoute = async ({ request, locals }) => {
    try {
        const user = locals.user;

        if (!user) {
            return errorResponse('Unauthorized', 401);
        }

        const body = await parseBody<{ currentPassword: string; newPassword: string }>(request);

        if (!body) {
            return errorResponse('Request body tidak valid');
        }

        const validationError = validateRequired(body, ['currentPassword', 'newPassword']);
        if (validationError) {
            return errorResponse(validationError);
        }

        if (body.newPassword.length < 8) {
            return errorResponse('Password baru minimal 8 karakter');
        }

        const prisma = getPrisma(locals);

        // Get current user with password
        const currentUser = await prisma.user.findUnique({
            where: { id: user.id },
        });

        if (!currentUser) {
            return errorResponse('User tidak ditemukan', 404);
        }

        // Verify current password
        const isValid = await verifyPassword(body.currentPassword, currentUser.password);
        if (!isValid) {
            return errorResponse('Password saat ini salah');
        }

        // Hash new password and update
        const hashedPassword = await hashPassword(body.newPassword);

        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });

        return jsonResponse({ message: 'Password berhasil diubah' });
    } catch (error) {
        return handleApiError(error);
    }
};
