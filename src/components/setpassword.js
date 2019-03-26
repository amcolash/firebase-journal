import React, {Component} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';

import crypt from '../crypt';
import firebase from '../firebase';
import Button from './button';

class SetPassword extends Component {
  constructor(props) {
    super(props);
    this.state = {
      password: ''
    };

    this.handleKey = this.handleKey.bind(this);
    this.savePassword = this.savePassword.bind(this);
  }

  handleKey(e){
    if(e.keyCode === 13) {
      this.savePassword();
    }
  }

  savePassword() {
    if (this.state.password.length > 6);
    const user = this.props.user;
    firebase.app.database().ref('/users/' + user.uid + '/key').set(crypt.encrypt(this.state.password, user.uid));
  }

  render() {
    return (
      <div>
        <span>It looks like this is your first time using this application.</span><br/>
        <span>You will need to set up an encryption password for recovery purposes.</span>
        <h3>You will not be able to change this password later!</h3>

        <input type="password" value={this.state.password}
          onChange={e => this.setState({password: e.target.value})}
          onKeyDown={this.handleKey}
        />

        <Button onClick={this.savePassword}>
          <FontAwesomeIcon icon={faLock} className="padRight"/>
          Save
        </Button>
      </div>
    );
  }
}

export default SetPassword;