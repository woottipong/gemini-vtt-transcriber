export const normalizeErrorMessage = (error: unknown) => {
    if (error instanceof Error) {
        return error.message;
    }

    if (typeof error === 'string') {
        return error;
    }

    return 'An unexpected error occurred.';
};

export const mapYoutubeErrorMessage = (error: unknown) => {
    const message = normalizeErrorMessage(error);
    const isNetworkError = message.includes('Failed to fetch')
        || message.includes('NetworkError')
        || message.includes('Unexpected token');

    return isNetworkError
        ? "Could not connect to the backend server. If running locally, ensure 'node server.js' is active."
        : message;
};
