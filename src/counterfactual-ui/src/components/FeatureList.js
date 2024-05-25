import React from 'react';
import { List, ListItem, ListItemText, IconButton, Typography, Divider, Box, Grid } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const FeatureList = ({ features, title, onHideFeature, onLockToggle }) => {
  return (
    <div style={{ margin: '20px 0' }}>
      <Typography variant="h5"> {title}</Typography>
      <Box sx={{ overflowY: 'auto' }}>
        <List>
          {features.map((feature, index) => (
            <div key={index}>
              <ListItem>
                <IconButton onClick={() => onLockToggle(index)} edge="start">
                  {feature.locked ? <LockIcon /> : <LockOpenIcon />}
                </IconButton>
                <IconButton onClick={() => onHideFeature(index)} edge="start">
                  <VisibilityOffIcon />
                </IconButton>
                <ListItemText
                  primary={
                    <Grid container alignItems="center">
                      <Grid item xs={5} marginLeft={'20px'}>
                        <Typography variant="h6">
                          {feature.name.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                        </Typography>
                      </Grid>
                      <Grid item xs={3}>
                        <Typography variant="h6"  color='primary'>
                          {feature.value}
                        </Typography>
                      </Grid>
                      { feature.changed && (
                        <>
                        <Grid item sx={{ display: 'flex', justifyContent: 'center' }}>
                          <ArrowForwardIcon color='error'/>
                        </Grid>
                        <Grid item xs={3}>
                          <Typography variant="h6" sx={{ color: 'red', textAlign: 'right' }}>
                            {feature.counterfactual}
                          </Typography> 
                        </Grid>
                        </>
                      )
                    } 
                    </Grid>
                  }
                />
              </ListItem>
              {index < features.length - 1 && <Divider />}
            </div>
          ))}
        </List>
      </Box>
    </div>
  );
};

export default FeatureList;
