import hashlib
import time

# Create a Block class
class Block:
    # Create a constructor for the Block class
    def __init__(self, index, timestamp, data, previous_hash):
        self.index = index
        self.timestamp = timestamp
        self.data = data
        self.previous_hash = previous_hash
        self.nonce = 0
        self.hash = self.calculate_hash()

    # Create a method to calculate the hash
    def calculate_hash(self):
        block_string = f"{self.index}{self.timestamp}{self.data}{self.previous_hash}{self.nonce}"
        return hashlib.sha256(block_string.encode('utf-8')).hexdigest()

    # Create a method to mine the block
    def mine_block(self, difficulty):
        target = '0' * difficulty
        while self.hash[:difficulty] != target:
            self.nonce += 1
            self.hash = self.calculate_hash()

    # Create a method to print the block
    def __str__(self):
        return f"Block #{self.index} [{self.timestamp}] {self.data} Hash: {self.hash}"

# Create a Blockchain class
class Blockchain:
    # Create a constructor for the Blockchain class
    def __init__(self, difficulty=4):
        self.chain = []
        self.difficulty = difficulty
        self.create_genesis_block()

    # Create a method to create the genesis block
    def create_genesis_block(self):
        genesis_block = Block(0, time.time(), "Genesis Block", "0")
        self.chain.append(genesis_block)

    # Create a method to add a block
    def add_block(self, data):
        last_block = self.chain[-1]
        new_block = Block(len(self.chain), time.time(), data, last_block.hash)
        new_block.mine_block(self.difficulty)
        self.chain.append(new_block)

    # Create a method to print the blockchain
    def print_chain(self):
        for block in self.chain:
            print(block)

    # Create a method to check if the blockchain is valid
    def is_chain_valid(self):
        for i in range(1, len(self.chain)):
            current_block = self.chain[i]
            previous_block = self.chain[i - 1]
            if current_block.hash != current_block.calculate_hash():
                print(f"Invalid block at index {i}")
                return False
            if current_block.previous_hash != previous_block.hash:
                print(f"Invalid link between blocks at index {i}")
                return False
        return True