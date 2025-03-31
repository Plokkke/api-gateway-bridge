export class NoErrorThrownError extends Error {}

export const getError = async (call: () => unknown): Promise<unknown> => {
  try {
    await call();

    return new NoErrorThrownError();
  } catch (error: unknown) {
    return error;
  }
};
