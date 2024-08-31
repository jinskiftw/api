class ConnectionsManager {
    constructor() {
      this.connections = new Map();
    }
  
    static getInstance() {
      if (!ConnectionsManager.instance) {
        ConnectionsManager.instance = new ConnectionsManager();
      }
      return ConnectionsManager.instance;
    }

    addConnection(ws, userData) {
        this.connections.set(ws, userData);
      }
    
      removeConnection(ws) {
        this.connections.delete(ws);
      }
    
      getUserData(ws) {
        return this.connections.get(ws);
      }
    
      getAllConnections() {
        return Array.from(this.connections.keys());
      }
      
  }

  module.exports = ConnectionsManager;


