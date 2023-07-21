import * as React from 'react'
import Stack from '@mui/material/Stack'
import Snackbar from '@mui/material/Snackbar'
import MuiAlert, { AlertProps } from '@mui/material/Alert'

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref,
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
})

export type Severity = 'success' | 'info' | 'warning' | 'error'

interface CustomizedSnackbarsProps {
  open: boolean
  message: string
  severity: Severity
  onClose: (event?: React.SyntheticEvent | Event, reason?: string) => void
}

export default function CustomizedSnackbars({ open, message, severity, onClose }: CustomizedSnackbarsProps) {
  return (
    <Stack spacing={2} sx={{ width: '100%' }}>
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={onClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={onClose} severity={severity} sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </Stack >
  )
}
