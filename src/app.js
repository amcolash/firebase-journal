import React, { Component, Fragment } from 'react';
import moment from 'moment';
import Loader from 'react-loader-spinner';
import { debounce } from 'debounce';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleDoubleLeft, faAngleDoubleRight, faCheck, faExpandArrowsAlt, faCompressArrowsAlt, faLongArrowAltDown,
  faMoon, faPlus, faSignOutAlt, faEye } from '@fortawesome/free-solid-svg-icons'
import { faGoogle } from '@fortawesome/free-brands-svg-icons'

import crypt from './crypt';
import firebase from './firebase.js';

import './app.css';
import Button from './button';
import Item from './item';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      itemList: {},
      itemTitle: '',
      itemText: '',
      selected: 0,
      saved: true,
      initialLoad: true,
      darkMode: true,
      simple: false,
      fullscreen: false,
      sidebar: true,
      initialAuth: true,
      user: undefined,
      decryptKey: ''
    };

    this.handleTitleChange = this.handleTitleChange.bind(this);
    this.handleTextChange = this.handleTextChange.bind(this);
    this.handleCreate = this.handleCreate.bind(this);
    this.selectItem = this.selectItem.bind(this);
    this.deleteItem = this.deleteItem.bind(this);
  }
  
  componentDidMount() {
    firebase.app.auth().onAuthStateChanged(u => {
      if (u) {
        this.setState({user: u, initialAuth: false});

        // Updating the `itemList` local state attribute when the Firebase Realtime Database data
        // under the '/itemList' path changes.
        this.firebaseRef = firebase.app.database().ref('/itemList');
        this.firebaseCallback = this.firebaseRef.on('value', (snap) => {
          const values = snap.val();

          if (!values) {
            this.setState({itemList: [], initialLoad: false});
            return;
          }

          const itemList = Object.entries(snap.val()).map(([key, value]) => { return {id: key, value: value}; }).sort((a, b) => {
            return b.value.created - a.value.created;
          });

          const selected = Math.min(this.state.selected, itemList.length - 1);
          const itemTitle = itemList[selected] ? itemList[selected].value.title : '';
          const itemText = itemList[selected] ? itemList[selected].value.text : '';

          this.setState({
            itemList: itemList || [],
            selected: selected || 0,
            itemTitle: itemTitle || '',
            itemText: itemText || '',
            initialLoad: false
          });
        });

        var key = firebase.app.database().ref('/key');
        key.on('value', (snap) => {
          const val = snap.val();
          if (val) this.setState({ decryptKey: crypt.decrypt(val, u.uid) });
        });
      } else {
        this.setState({user: undefined, initialAuth: false});
      }
    });
  }
  
  componentWillUnmount() {
    // Un-register the listener on '/itemList'.
    this.firebaseRef.off('value', this.firebaseCallback);
    this.updateData.clear();
  }

  handleTitleChange(e) {
    const title = crypt.encrypt(e.target.value, this.state.decryptKey);
    this.setState({itemTitle: title, saved: false});
    this.updateData();
  }

  handleTextChange(e) {
    const text = crypt.encrypt(e.target.value, this.state.decryptKey);
    this.setState({itemText: text, saved: false});
    this.updateData();
  }
  
  updateData = debounce(() => {
    const { selected, itemList, itemTitle, itemText } = this.state;
    this.firebaseRef.child(itemList[selected].id).update({
      title: itemTitle,
      text: itemText,
      updated: new Date().getTime()
    }, err => {
      if (!err) this.setState({saved: true});
    });
  }, 1500);
  
  // This is triggered when the "Add New item" button is clicked.
  handleCreate(e) {
    if (e) e.preventDefault();
    const decryptKey = this.state.decryptKey;

    // Add the new item to Firebase.
    const now = new Date();
    const title = moment(now).format('M/D/YYYY, h:mm A');
    const text = '...';
    this.firebaseRef.push({
      created: now.getTime(),
      updated: now.getTime(),
      title: crypt.encrypt(title, decryptKey),
      text: crypt.encrypt(text, decryptKey),
    }, err => {
      if (!err) {
        this.selectItem(Math.max(0, this.state.selected - 1));
      }
    });
  }

  deleteItem(id) {
    var del = window.confirm('Are you sure you want to delete this note?');
    if (del) this.firebaseRef.child(id).remove();
  }

  selectItem(index) {
    const { selected, itemList, itemText, itemTitle, saved } = this.state;

    // Save unsaved changes on select of new item
    this.updateData.clear();
    if (!saved) {
      this.firebaseRef.child(itemList[selected].id).update({
        title: itemTitle,
        text: itemText,
        updated: new Date().getTime()
      });
    }

    this.setState({selected: index, itemText: itemList[index].value.text, itemTitle: itemList[index].value.title, saved: true});
  }

  render() {
    const { initialLoad, saved, selected, itemList, darkMode, fullscreen, sidebar, user, initialAuth, decryptKey, simple } = this.state;
    const itemTitle = user ? crypt.decrypt(this.state.itemTitle, decryptKey) : '';
    const itemText = user ? crypt.decrypt(this.state.itemText, decryptKey) : '';

    return (
      <div className={"App" + (darkMode ? "" : " inverted") + (!user || initialAuth || initialLoad ? " center" : "")}>
        {!user && !initialAuth ? (
          <div className="signin">
            <span>You are not authenticated.</span><br/>
            <span>You need to sign in to use this app.</span><br/>
            <br/>
            <Button title="Sign In" onClick={() => firebase.signIn()}>
              <FontAwesomeIcon icon={faGoogle} className="padRight" />
              Sign In
            </Button>
          </div>
        ) : (
          initialAuth || initialLoad ? (
            <Loader type="Triangle" color="#ccc" height="80" width="80" />
          ) : (
            <Fragment>
              {itemList.length === 0 ? (
                <div className="noNotes">
                  <h2>
                    You don't have any notes yet.
                    <br/>
                    Click the plus button to get started.
                  </h2>
                  <FontAwesomeIcon icon={faLongArrowAltDown} className="arrow" />
                </div>
              ) : (
                <Fragment>
                  <div className={"column left" + (sidebar ? "" : " collapsed")}>
                    <div className="dates">
                      {itemList ? Object.entries(itemList).map(([index, item]) => {
                        index = Number.parseInt(index);
                        return (
                          <Item
                            index={index}
                            key={index}
                            selected={selected}
                            item={item}
                            itemTitle={itemTitle}
                            decryptKey={decryptKey}
                            darkMode={darkMode}
                            selectItem={this.selectItem}
                            deleteItem={this.deleteItem}
                          />
                        )
                      }) : null}
                    </div>
                    <div className={"footer" + (!sidebar ? " collapsed" : "")}>
                      <Button title="Sign Out" onClick={() => firebase.app.auth().signOut()}>
                        <FontAwesomeIcon icon={faSignOutAlt}/>
                      </Button>

                      <div className="spacer"></div>

                      <Button title="Toggle Dark Mode" selected={darkMode} onClick={() => this.setState({darkMode: !darkMode})}>
                        <FontAwesomeIcon icon={faMoon}/>
                      </Button>

                      <Button title="Toggle Simple Mode" selected={simple} onClick={() => {
                        var newSidebar = !simple ? false : sidebar;
                        this.setState({simple: !simple, sidebar: newSidebar})}
                      }>
                        <FontAwesomeIcon icon={faEye}/>
                      </Button>

                      <Button title="Toggle Full Screen" selected={fullscreen} onClick={() => {
                        if (fullscreen) {
                          document.exitFullscreen();
                        } else {
                          document.documentElement.requestFullscreen();
                        }

                        this.setState({fullscreen: !fullscreen});
                      }}>
                        <FontAwesomeIcon icon={fullscreen ? faCompressArrowsAlt : faExpandArrowsAlt}/>
                      </Button>

                      <div className="spacer"></div>
                      <Button title="Toggle Sidebar" onClick={() => this.setState({sidebar: !sidebar, simple: false})}>
                        <FontAwesomeIcon icon={sidebar ? faAngleDoubleLeft : faAngleDoubleRight}/>
                      </Button>
                    </div>
                  </div>
          
                  <div className={"column right" + (sidebar ? "" : " expanded") + (simple ? " simple" : "")}>
                    <div>
                      <h3>
                        <input className="title" type="text" value={itemTitle} onChange={this.handleTitleChange}/>
                        <FontAwesomeIcon icon={faCheck} className={"saved" + (saved ? "" : " hidden") + (darkMode ? "" : " specialInverted")} />
                      </h3>
                    </div>
                    <textarea value={itemText} onChange={this.handleTextChange}/>
                  </div>
                </Fragment>
              )}
    
              <Button title="New Item" className={"circle" + (itemList.length === 0 ? " glow" : "")} onClick={this.handleCreate}>
                <FontAwesomeIcon icon={faPlus}/>
              </Button>
            </Fragment>
          )
        )}
      </div>
    );
  }
}

export default App;
