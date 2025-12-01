import React, { createContext, useContext, useState } from 'react';

export const NoticeContext = createContext({
  notice: undefined,
  setNotice: ()=>{} ,
});

export const NoticeContextProvider = (props)=>{
  const [notice, setNotice] = useState();

  return(
    <NoticeContext.Provider value={{notice: notice, setNotice:setNotice }}>
    {props.children}
    </NoticeContext.Provider>
  )
};

export const useNotice = () => useContext(NoticeContext);