from blockchain.blockchain import Block, Blockchain

blockchain = Blockchain()

blockchain.add_block({'transactions': ['Alice paga Bob 50 BTC', 'Bob paga Charlie 30 BTC'], 'metadata': 'Block 1 Data'})
blockchain.add_block({'transactions': ['Charlie paga Alice 20 BTC'], 'metadata': 'Block 2 Data'})
blockchain.add_block({'transactions': ['Alice paga Dave 10 BTC', 'Dave paga Bob 5 BTC'], 'metadata': 'Block 3 Data'})

print("Blockchain:")
blockchain.print_chain()
 
print("\nLa blockchain è valida?", "Sì" if blockchain.is_chain_valid() else "No")
