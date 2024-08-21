'use client';

import { useState } from "react";
import { Box, Stack, TextField, Button, Typography, Paper, AppBar, Toolbar, IconButton, CssBaseline } from "@mui/material";
import SendIcon from '@mui/icons-material/Send';
import SchoolIcon from '@mui/icons-material/School';

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm the Rate my professor support assistant. How can I assist you today?"
    }
  ]);

  const [message, setMessage] = useState('');

  const sendMessage = async () => {
    setMessage('');
    setMessages((messages) => [
      ...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: '' },
    ]);

    try {
      const response = await fetch('/api/chat', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([...messages, { role: "user", content: message }]),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = '';

      reader.read().then(function processText({ done, value }) {
        if (done) return result;

        const text = decoder.decode(value || new Uint8Array(), { stream: true });
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1];
          let otherMessages = messages.slice(0, messages.length - 1);
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text },
          ];
        });
        return reader.read().then(processText);
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <>
      <CssBaseline />
      <Box
        width="100vw"
        height="100vh"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        bgcolor="#f0f4f8"
      >
        <AppBar position="fixed" color="primary">
          <Toolbar>
            <IconButton edge="start" color="inherit" aria-label="menu">
              <SchoolIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Rate My Professor Assistant
            </Typography>
          </Toolbar>
        </AppBar>
        <Box
          component="main"
          width="100%"
          display="flex"
          justifyContent="center"
          alignItems="center"
          flexGrow={1}
          mt={8} // This pushes the content below the AppBar
        >
          <Paper elevation={3} sx={{ width: "500px", height: "700px", mt: 5, borderRadius: 3, overflow: "hidden" }}>
            <Stack
              direction={'column'}
              spacing={2}
              height="100%"
              p={3}
            >
              <Stack
                direction={'column'}
                spacing={2}
                flexGrow={1}
                overflow="auto"
                maxHeight="100%"
                sx={{ paddingRight: 2 }}
              >
                {messages.map((message, index) => (
                  <Box
                    key={index}
                    display="flex"
                    justifyContent={
                      message.role === 'assistant' ? 'flex-start' : 'flex-end'
                    }
                  >
                    <Box
                      bgcolor={
                        message.role === 'assistant'
                          ? 'primary.main'
                          : 'secondary.main'
                      }
                      color="white"
                      borderRadius={2}
                      p={2}
                      maxWidth="80%"
                    >
                      <Typography variant="body1" component="p">
                        {message.content}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
              <Stack direction={'row'} spacing={2} alignItems="center">
                <TextField
                  label="Type your message"
                  fullWidth
                  variant="outlined"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={sendMessage}
                  endIcon={<SendIcon />}
                >
                  Send
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Box>
      </Box>
    </>
  );
}
