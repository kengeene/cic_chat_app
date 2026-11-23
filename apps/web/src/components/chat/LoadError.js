import { Alert, Button } from '@mantine/core';

export function LoadError({ title, onRetry }) {
  return (
    <Alert color="red" title={title} m="sm">
      <Button size="xs" variant="light" color="red" onClick={() => onRetry()}>
        Try again
      </Button>
    </Alert>
  );
}
