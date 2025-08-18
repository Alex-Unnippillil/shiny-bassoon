import React from 'react';
import { Dialog, DialogTitle, DialogActions, Button } from '@mui/material';

type Side = 'white' | 'black';

interface ChooseSideDialogProps {
  open: boolean;
  onChoose: (side: Side) => void;
}

export default function ChooseSideDialog({ open, onChoose }: ChooseSideDialogProps): JSX.Element {
  return (
    <Dialog open={open} aria-labelledby="choose-side-title">
      <DialogTitle id="choose-side-title">Choose your side</DialogTitle>
      <DialogActions>
        <Button onClick={() => onChoose('white')}>Play White</Button>
        <Button onClick={() => onChoose('black')}>Play Black</Button>
      </DialogActions>
    </Dialog>
  );
}

