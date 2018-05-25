class Grid:
    def __init__(self):
        self.header = []
        self.val_types = {}
        self.grid = {}
        self.style = {}

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

    def sef_value_type(self, column, val_type):
        self.val_types[column, val_type]

    def set_style(self, column, index, style):
        self.style[index][column] = style

    def get_row(self, index):
        return self.grid[index]

    def get_row_style(self, index):
        return self.grid[index]

