// projo-web/src/App.tsx
import { Box, Container, Paper, Typography, Button } from '@mui/material';

function App() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            PROJO Web
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Personnel & Project Operations – Admin Dashboard
          </Typography>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button variant="contained" color="primary">
              Workers
            </Button>
            <Button variant="outlined" color="secondary">
              Projects
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default App;