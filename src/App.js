import React, { Component, Fragment } from 'react';
import { debounce } from "debounce";
import firebase from './firebase.js';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      todoList: {}, // Mirrors the Todo list in Firebase.
      todoText: '', // Mirrors the new Todo Text field in the UI.
      selected: 0,
      saved: true,
      initialLoad: true
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }
  
  componentDidMount() {
    // Updating the `todoList` local state attribute when the Firebase Realtime Database data
    // under the '/todoList' path changes.
    this.firebaseRef = firebase.database().ref('/todoList');
    this.firebaseCallback = this.firebaseRef.on('value', (snap) => {
      const values = snap.val();

      if (!values) {
        this.setState({todoList: [], initialLoad: false});
        return;
      }

      const todoList = Object.entries(snap.val()).map(([key, value]) => { return {id: key, value: value}; }).sort((a, b) => {
        return b.value.date - a.value.date;
      });

      const selected = Math.min(this.state.selected, todoList.length - 1);
      const todoText = todoList[selected] ? todoList[selected].value.text : '';

      this.setState({ todoList: todoList || [], selected: selected || 0, todoText: todoText || '', initialLoad: false });
    });
  }
  
  componentWillUnmount() {
    // Un-register the listener on '/todoList'.
    this.firebaseRef.off('value', this.firebaseCallback);
    this.updateData.clear();
  }

  handleChange(e) {
    this.setState({todoText: e.target.value, saved: false});
    this.updateData();
  }
  
  updateData = debounce(() => {
    const { selected, todoList, todoText } = this.state;
    this.firebaseRef.child(todoList[selected].id).update({text: todoText}, err => {
      if (!err) this.setState({saved: true});
    });
  }, 2000);
  
  // This is triggered when the "Add New Todo" button is clicked.
  handleSubmit(e) {
    if (e) e.preventDefault();
    // Add the new todo to Firebase.
    this.firebaseRef.push({
      text: 'This is a new item',
      date: new Date().getTime()
    });
  }

  delete(key) {
    this.firebaseRef.child(key).remove();
  }

  select(index) {
    const { selected, todoList, todoText } = this.state;

    this.updateData.clear();
    this.firebaseRef.child(todoList[selected].id).update({text: todoText});
    this.setState({selected: index, todoText: todoList[index].value.text});
  }

  render() {
    const { initialLoad, saved, selected, todoList, todoText } = this.state;

    return (
      <div className="App">
        {initialLoad ? null : (
          <Fragment>
            {todoList.length === 0 ? (
              <div className="noNotes">
                <h2>
                  You don't have any notes yet.
                  <br/>
                  Click the plus button to get started.
                </h2>
                <div className="icon">⬇</div>
              </div>
            ) : (
              <Fragment>
                <div className="column left">
                  <div className="dates">
                    {todoList ? Object.entries(todoList).map(([index, item]) => {
                      index = Number.parseInt(index);
                      const date = new Date(item.value.date).toLocaleString();
                      return <div className={"item" + (selected === index ? " selected" : "")} key={index}>
                        <button className="date" onClick={() => this.select(index)}>{date}</button>
                        <button className="delete" onClick={() => this.delete(item.id)}>X</button>
                      </div>
                    }) : null}
                  </div>
                </div>
        
                <div className="column right">
                  <div>
                    <h3>
                      {new Date(todoList[selected].value.date).toLocaleString()}
                      <span className={"saved" + (saved ? "" : " hidden")}>✓</span>
                    </h3>
                  </div>
                  <textarea value={todoText} onChange={this.handleChange}/>
                </div>
              </Fragment>
            )}
  
            <button className={"button" + (todoList.length === 0 ? " glow" : "")} onClick={this.handleSubmit}>+</button>
          </Fragment>
        )}
      </div>
    );
  }
}

export default App;
