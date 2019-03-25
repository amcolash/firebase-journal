import React, { Component, Fragment } from 'react';
import moment from 'moment';
import Loader from 'react-loader-spinner';
import { debounce } from 'debounce';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleDoubleLeft, faAngleDoubleRight, faCheck, faExpandArrowsAlt, faCompressArrowsAlt, faLongArrowAltDown,
  faMoon, faPlus, faTrash, faSignOutAlt, faEye } from '@fortawesome/free-solid-svg-icons'
import { faGoogle } from '@fortawesome/free-brands-svg-icons'
import firebase from './firebase.js';
import crypt from './crypt';
import './App.css';

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
      key: ''
    };

    this.handleTitleChange = this.handleTitleChange.bind(this);
    this.handleTextChange = this.handleTextChange.bind(this);
    this.handleCreate = this.handleCreate.bind(this);
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
          this.setState({
            key: snap.val()
          });
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
    const { user, key } = this.state;
    const title = crypt.encrypt(e.target.value, crypt.decrypt(key, user.uid));
    this.setState({itemTitle: title, saved: false});
    this.updateData();
  }

  handleTextChange(e) {
    const { user, key } = this.state;
    const text = crypt.encrypt(e.target.value, crypt.decrypt(key, user.uid));
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
    const { user, key } = this.state;

    // Add the new item to Firebase.
    const now = new Date();
    const title = moment(now).format('M/D/YYYY, h:mm A');
    const text = '...';
    this.firebaseRef.push({
      created: now.getTime(),
      updated: now.getTime(),
      title: crypt.encrypt(title, crypt.decrypt(key, user.uid)),
      text: crypt.encrypt(text, crypt.decrypt(key, user.uid)),
    }, err => {
      if (!err) {
        this.select(Math.max(0, this.state.selected - 1));
      }
    });
  }

  delete(key) {
    var del = window.confirm('Are you sure you want to delete this note?');
    if (del) this.firebaseRef.child(key).remove();
  }

  select(index) {
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
    const { initialLoad, saved, selected, itemList, darkMode, fullscreen, sidebar, user, initialAuth, key, simple } = this.state;
    const itemTitle = user ? crypt.decrypt(this.state.itemTitle, crypt.decrypt(key, user.uid)) : '';
    const itemText = user ? crypt.decrypt(this.state.itemText, crypt.decrypt(key, user.uid)) : '';

    return (
      <div className={"App" + (darkMode ? "" : " inverted") + (!user || initialAuth || initialLoad ? " center" : "")}>
        {!user && !initialAuth ? (
          <div className="signin">
            <span>You are not authenticated.</span><br/>
            <span>You need to sign in to use this app.</span><br/>
            <br/>
            <button title="Sign In" className="button" onClick={() => firebase.signIn()}>
              <FontAwesomeIcon icon={faGoogle} className="padRight" />
              Sign In
            </button>
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
                          <div className="item" key={index}>
                            <button className={"button date" + (selected === index ? " selected" : "")} onClick={() => this.select(index)}>
                              {selected === index ? itemTitle : item.value.title}
                              <br/>
                              <span className="updated">{moment(item.value.updated).fromNow()}</span>
                            </button>
                            <button title="Delete" className={"button delete" + (darkMode ? "" : " inverted")} onClick={() => this.delete(item.id)}>
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        )
                      }) : null}
                    </div>
                    <div className={"footer" + (!sidebar ? " collapsed" : "")}>
                      <button title="Sign Out" className="button" onClick={() => firebase.app.auth().signOut()}>
                        <FontAwesomeIcon icon={faSignOutAlt}/>
                      </button>

                      <div className="spacer"></div>

                      <button title="Toggle Dark Mode" className={"button" + (darkMode ? " selected" : "")} onClick={() => this.setState({darkMode: !darkMode})}>
                        <FontAwesomeIcon icon={faMoon}/>
                      </button>

                      <button title="Toggle Simple Mode" className={"button" + (simple ? " selected" : "")} onClick={() => {
                        var newSidebar = !simple ? false : sidebar;
                        this.setState({simple: !simple, sidebar: newSidebar})}
                      }>
                        <FontAwesomeIcon icon={faEye}/>
                      </button>

                      <button title="Toggle Full Screen" className={"button" + (fullscreen ? " selected" : "")} onClick={() => {
                        if (fullscreen) {
                          document.exitFullscreen();
                        } else {
                          document.documentElement.requestFullscreen();
                        }

                        this.setState({fullscreen: !fullscreen});
                      }}>
                        <FontAwesomeIcon icon={fullscreen ? faCompressArrowsAlt : faExpandArrowsAlt}/>
                      </button>

                      <div className="spacer"></div>
                      <button title="Toggle Sidebar" className={"button"} onClick={() => this.setState({sidebar: !sidebar, simple: false})}>
                        <FontAwesomeIcon icon={sidebar ? faAngleDoubleLeft : faAngleDoubleRight}/>
                      </button>
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
    
              <button title="New Item" className={"circle" + (itemList.length === 0 ? " glow" : "")} onClick={this.handleCreate}>
                <FontAwesomeIcon icon={faPlus}/>
              </button>
            </Fragment>
          )
        )}
      </div>
    );
  }
}

export default App;
