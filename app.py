# here we import the necessary libraries 
import streamlit as st 
from dotenv import load_dotenv
from PyPDF2 import PdfReader 
from langchain.text_splitter import CharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain.memory import ConversationBufferMemory 
from langchain.chains import ConversationalRetrievalChain 
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.embeddings import HuggingFaceEmbeddings
from HtmlTemplate import css, bot_template, user_template

# function to get the text from the pdf file 
def get_pdf_text(pdf_docs):
    text = ""
    for pdf in pdf_docs:
        pdf_reader = PdfReader(pdf)
        for page in pdf_reader.pages:
            text += page.extract_text()
    return text 

# function to get the text chunks 
def get_text_chunks(raw_text):
    text_splitter = CharacterTextSplitter(
        separator="\n",
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len 
    )
    chunks = text_splitter.split_text(raw_text) 
    return chunks 

# vector store function definition 
def get_vectorstore(text_chunks):
    # Using HuggingFace embeddings to avoid Google API quota limits
    # This runs locally and doesn't require API calls
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    vectorstore = Chroma.from_texts(texts=text_chunks, embedding=embeddings)
    return vectorstore

# defining the get conversation chain function 
def get_conversation_chain(vectorstore):
    llm = ChatGoogleGenerativeAI(model="gemini-pro", temperature=0.3)
    memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
    conversation_chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=vectorstore.as_retriever(),
        memory=memory 
    )
    return conversation_chain 

def handle_userinput(user_question):
    if st.session_state.conversation is None:
        st.error("Please upload and process PDF files first before asking questions.")
        return
    
    response = st.session_state.conversation({"question": user_question})
    st.session_state.chat_history = response['chat_history']
    for i, message in enumerate(st.session_state.chat_history):
        if i % 2 == 0:
            st.write(user_template.replace("{MSG}", message.content), unsafe_allow_html=True)
        else:
            st.write(bot_template.replace("{MSG}", message.content), unsafe_allow_html=True)

def main():
    load_dotenv()
    st.set_page_config(page_title="PDF Reader AI", page_icon=":books:")
    st.write(css, unsafe_allow_html=True)
    
    if "conversation" not in st.session_state:
        st.session_state.conversation = None 
    if "chat_history" not in st.session_state:
        st.session_state.chat_history = None 

    st.header("PDF Reader AI :books:")
    user_question = st.text_input("Ask a question about your PDF File:")
    if user_question:
        handle_userinput(user_question)

    with st.sidebar:
        st.subheader("Your Documents")
        pdf_docs = st.file_uploader("Upload your PDF files here and click on 'Process'", accept_multiple_files=True)
        if st.button("Process"):
            with st.spinner("Processing..."):
                # extracting the raw text data from the pdf file 
                raw_text = get_pdf_text(pdf_docs)

                # getting the text chunks for dividing into smaller pieces 
                text_chunks = get_text_chunks(raw_text)
                
                # creating the vector store to get the embeddings 
                st.session_state.vectorstore = get_vectorstore(text_chunks)
                
                # conversation chain 
                st.session_state.conversation = get_conversation_chain(st.session_state.vectorstore)

if __name__ == "__main__":
    main()
