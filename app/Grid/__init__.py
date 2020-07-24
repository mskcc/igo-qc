class Grid:
    def __init__(self):
        self.header = []
        self.val_types = {}
        self.grid = {}
        self.style = {}

    def get_header(self):
        return self.header

    def get_val_types(self):
        return self.val_types

    def get_grid(self):
        return self.grid

    def get_style(self):
        return self.style

    def set_header(self, header):
        self.header = header
        for col_name in header:
            self.val_types[col_name] = ".2f"

    def set_value(self, column, index, value):
        if index not in self.grid:
            self.grid[index] = {}
            self.style[index] = {}
        self.grid[index][column] = value
        self.style[index][column] = None

    def set_value_type(self, column, val_type):
        self.val_types[column] = val_type

    def set_style(self, column, index, style):
        self.style[index][column] = style

    def get_row(self, index):
        return self.grid[index]

    def get_row_style(self, index):
        return self.grid[index]

    def assign_value_types(self):
        self.set_value_type("Run", "s")
        self.set_value_type("Sample", "s")
        self.set_value_type("IGO Id", "s")
        self.set_value_type("Genome", "s")
        self.set_value_type("Tumor or Normal", "s")
        self.set_value_type("Coverage Target", "d")
        self.set_value_type("Pct. Adapters", "4f")
        self.set_value_type("Reads Examined", "d")
        self.set_value_type("Unpaired Reads", "d")
        self.set_value_type("Sum Reads", "d")
        self.set_value_type("Unmapped", "d")
        self.set_value_type("Initial Pool", "s")

    def __repr__(self):
        num_index = len(self.grid)
        output_str = ""
        for i in self.grid:
            current_dict = self.grid[i]
            temp_str = str(i)
            for value in current_dict:
                temp_str +=  "\t" + value + "\t" + str(current_dict[value])
            output_str += temp_str.strip() + "\n"
        return output_str
