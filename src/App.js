import React, { Component, Fragment } from 'react';
import moment from 'moment';
import { debounce } from 'debounce';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleDoubleLeft, faAngleDoubleRight, faCheck, faExpandArrowsAlt, faCompressArrowsAlt, faLongArrowAltDown, faMoon, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons'
import firebase from './firebase.js';
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
      fullscreen: false,
      sidebar: true
    };

    this.handleTitleChange = this.handleTitleChange.bind(this);
    this.handleTextChange = this.handleTextChange.bind(this);
    this.handleCreate = this.handleCreate.bind(this);
  }
  
  componentDidMount() {
    // Updating the `itemList` local state attribute when the Firebase Realtime Database data
    // under the '/itemList' path changes.
    this.firebaseRef = firebase.database().ref('/itemList');
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
  }
  
  componentWillUnmount() {
    // Un-register the listener on '/itemList'.
    this.firebaseRef.off('value', this.firebaseCallback);
    this.updateData.clear();
  }

  handleTitleChange(e) {
    this.setState({itemTitle: e.target.value, saved: false});
    this.updateData();
  }

  handleTextChange(e) {
    this.setState({itemText: e.target.value, saved: false});
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
    // Add the new item to Firebase.
    const now = new Date();
    this.firebaseRef.push({
      created: now.getTime(),
      updated: now.getTime(),
      title: moment(now).format('M/D/YYYY, h:mm A'),
      text: '...',
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
    const { initialLoad, saved, selected, itemList, itemTitle, itemText, darkMode, fullscreen, sidebar } = this.state;

    return (
      <div className={"App" + (darkMode ? "" : " inverted")}>
        {initialLoad ? null : (
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
                          <button className={"button delete" + (darkMode ? "" : " inverted")} onClick={() => this.delete(item.id)}>
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      )
                    }) : null}
                  </div>
                  <div className={"footer" + (!sidebar ? " collapsed" : "")}>
                    <div className="spacer"></div>
                    <button className={"button" + (darkMode ? " selected" : "")} onClick={() => this.setState({darkMode: !darkMode})}>
                      <FontAwesomeIcon icon={faMoon}/>
                    </button>

                    <button className={"button" + (fullscreen ? " selected" : "")} onClick={() => {
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
                    <button className={"button"} onClick={() => this.setState({sidebar: !sidebar})}>
                      <FontAwesomeIcon icon={sidebar ? faAngleDoubleLeft : faAngleDoubleRight}/>
                    </button>
                  </div>
                </div>
        
                <div className={"column right" + (sidebar ? "" : " expanded")}>
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
  
            <button className={"circle" + (itemList.length === 0 ? " glow" : "")} onClick={this.handleCreate}>
              <FontAwesomeIcon icon={faPlus}/>
            </button>
          </Fragment>
        )}
      </div>
    );
  }
}

export default App;
