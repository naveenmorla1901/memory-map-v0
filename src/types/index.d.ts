declare module '@react-native-community/netinfo' {
  interface NetInfoState {
    isConnected: boolean;
    // other properties...
  }
  // other type definitions...
}

declare module 'expo-sqlite' {
  export interface WebSQLDatabase {
    transaction(callback: (tx: SQLTransaction) => void): void;
    // other methods...
  }

  export interface SQLTransaction {
    executeSql(
      sqlStatement: string,
      args?: any[],
      callback?: (transaction: SQLTransaction, resultSet: SQLResultSet) => void,
      errorCallback?: (transaction: SQLTransaction, error: SQLError) => boolean
    ): void;
  }

  // other interfaces...
} 