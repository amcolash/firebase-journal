import React, {Component} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';

import firebase from '../firebase';
import Button from './button';

class Login extends Component {
  render() {
    return (
        <div className="login">
          <span>You are not authenticated.</span><br/>
          <span>You need to log in to use this app.</span><br/>
          <br/>
          <Button title="Log In" onClick={() => firebase.signIn()}>
            <FontAwesomeIcon icon={faGoogle} className="padRight" />
            Log In
          </Button>
        </div>
    );
  }
}

export default Login;