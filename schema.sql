-- ===========================================================================
-- DATABASE SCHEMA & STORED PROCEDURES
-- Project: CheckDataPerson (Figma Make Backend)
-- Database: SQL Server (MSSQL)
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. TABLES CREATION
-- ---------------------------------------------------------------------------

-- Create users table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
BEGIN
    CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        nama VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        perusahaan VARCHAR(100) NOT NULL,
        user_group VARCHAR(50) NOT NULL, -- 'Administrator' or 'Checker'
        status VARCHAR(20) NOT NULL DEFAULT 'aktif', -- 'aktif' or 'nonaktif'
        otp_code VARCHAR(6) NULL,
        otp_expiry DATETIME NULL
    );
END;

-- Create customers table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'customers')
BEGIN
    CREATE TABLE customers (
        id INT IDENTITY(1,1) PRIMARY KEY,
        code VARCHAR(20) NOT NULL,
        nik VARCHAR(20) UNIQUE NOT NULL,
        nama VARCHAR(100) NOT NULL,
        tglLahir DATE NOT NULL,
        jenisKelamin VARCHAR(20) NOT NULL,
        alamat TEXT NULL,
        noHp VARCHAR(20) NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'aktif'
    );
END;
GO

-- ---------------------------------------------------------------------------
-- 2. STORED PROCEDURES FOR USERS
-- ---------------------------------------------------------------------------

-- sp_User_GetByEmail
CREATE OR ALTER PROCEDURE sp_User_GetByEmail
    @Email VARCHAR(100)
AS
BEGIN
    SELECT id, username, nama, email, password, perusahaan, user_group, status 
    FROM users 
    WHERE email = @Email;
END;
GO

-- sp_User_UpdateOtp
CREATE OR ALTER PROCEDURE sp_User_UpdateOtp
    @Email VARCHAR(100),
    @OtpCode VARCHAR(6),
    @OtpExpiry DATETIME
AS
BEGIN
    UPDATE users
    SET otp_code = @OtpCode, otp_expiry = @OtpExpiry
    WHERE email = @Email;
END;
GO

-- sp_User_VerifyOtp
CREATE OR ALTER PROCEDURE sp_User_VerifyOtp
    @Email VARCHAR(100),
    @OtpCode VARCHAR(6)
AS
BEGIN
    SELECT id, username, nama, email, user_group, status
    FROM users
    WHERE email = @Email 
      AND otp_code = @OtpCode 
      AND otp_expiry >= GETUTCDATE();
END;
GO

-- sp_User_ResetPassword
CREATE OR ALTER PROCEDURE sp_User_ResetPassword
    @Id INT,
    @Password VARCHAR(255)
AS
BEGIN
    UPDATE users
    SET password = @Password
    WHERE id = @Id;
END;
GO

-- sp_User_GetAll
CREATE OR ALTER PROCEDURE sp_User_GetAll
AS
BEGIN
    SELECT id, username, nama, email, perusahaan, user_group, status
    FROM users;
END;
GO

-- sp_User_Insert
CREATE OR ALTER PROCEDURE sp_User_Insert
    @Username VARCHAR(50),
    @Nama VARCHAR(100),
    @Email VARCHAR(100),
    @Password VARCHAR(255),
    @Perusahaan VARCHAR(100),
    @UserGroup VARCHAR(50),
    @Status VARCHAR(20)
AS
BEGIN
    INSERT INTO users (username, nama, email, password, perusahaan, user_group, status)
    VALUES (@Username, @Nama, @Email, @Password, @Perusahaan, @UserGroup, @Status);
    
    SELECT SCOPE_IDENTITY() AS NewId;
END;
GO

-- sp_User_Update
CREATE OR ALTER PROCEDURE sp_User_Update
    @Id INT,
    @Username VARCHAR(50),
    @Nama VARCHAR(100),
    @Email VARCHAR(100),
    @Perusahaan VARCHAR(100),
    @UserGroup VARCHAR(50),
    @Status VARCHAR(20)
AS
BEGIN
    UPDATE users
    SET username = @Username,
        nama = @Nama,
        email = @Email,
        perusahaan = @Perusahaan,
        user_group = @UserGroup,
        status = @Status
    WHERE id = @Id;
END;
GO

-- sp_User_Delete
CREATE OR ALTER PROCEDURE sp_User_Delete
    @Id INT
AS
BEGIN
    DELETE FROM users WHERE id = @Id;
END;
GO

-- sp_User_ChangePassword
-- Note: password comparison is performed in application layer using bcrypt.
-- This SP only updates the stored password hash.
CREATE OR ALTER PROCEDURE sp_User_ChangePassword
    @Email VARCHAR(100),
    @NewPassword VARCHAR(255)
AS
BEGIN
    UPDATE users
    SET password = @NewPassword
    WHERE email = @Email;
END;
GO


-- ---------------------------------------------------------------------------
-- 3. STORED PROCEDURES FOR CUSTOMERS
-- ---------------------------------------------------------------------------

-- sp_Customer_GetAll
CREATE OR ALTER PROCEDURE sp_Customer_GetAll
    @Search VARCHAR(100) = NULL
AS
BEGIN
    IF @Search IS NULL OR @Search = ''
    BEGIN
        SELECT id, code, nik, nama, tglLahir, jenisKelamin, alamat, noHp, status
        FROM customers;
    END
    ELSE
    BEGIN
        SELECT id, code, nik, nama, tglLahir, jenisKelamin, alamat, noHp, status
        FROM customers
        WHERE nama LIKE '%' + @Search + '%'
           OR nik LIKE '%' + @Search + '%'
           OR code LIKE '%' + @Search + '%';
    END
END;
GO

-- sp_Customer_Check
CREATE OR ALTER PROCEDURE sp_Customer_Check
    @Code VARCHAR(20),
    @Nama VARCHAR(100),
    @Nik VARCHAR(20)
AS
BEGIN
    -- Query matching records by NIK partial (LIKE) or Nama partial (LIKE)
    -- for backend evaluation
    SELECT id, code, nik, nama, tglLahir, jenisKelamin, alamat, noHp, status
    FROM customers
    WHERE nik LIKE '%' + @Nik + '%'
       OR nama LIKE '%' + @Nama + '%';
END;
GO

-- sp_Customer_Insert
CREATE OR ALTER PROCEDURE sp_Customer_Insert
    @Code VARCHAR(20),
    @Nik VARCHAR(20),
    @Nama VARCHAR(100),
    @TglLahir DATE,
    @JenisKelamin VARCHAR(20),
    @Alamat TEXT,
    @NoHp VARCHAR(20),
    @Status VARCHAR(20)
AS
BEGIN
    INSERT INTO customers (code, nik, nama, tglLahir, jenisKelamin, alamat, noHp, status)
    VALUES (@Code, @Nik, @Nama, @TglLahir, @JenisKelamin, @Alamat, @NoHp, @Status);
    
    SELECT SCOPE_IDENTITY() AS NewId;
END;
GO

-- sp_Customer_Update
CREATE OR ALTER PROCEDURE sp_Customer_Update
    @Nik VARCHAR(20),
    @Code VARCHAR(20),
    @Nama VARCHAR(100),
    @TglLahir DATE,
    @JenisKelamin VARCHAR(20),
    @Alamat TEXT,
    @NoHp VARCHAR(20),
    @Status VARCHAR(20)
AS
BEGIN
    UPDATE customers
    SET code = @Code,
        nama = @Nama,
        tglLahir = @TglLahir,
        jenisKelamin = @JenisKelamin,
        alamat = @Alamat,
        noHp = @NoHp,
        status = @Status
    WHERE nik = @Nik;
END;
GO

-- sp_Customer_Delete
CREATE OR ALTER PROCEDURE sp_Customer_Delete
    @Nik VARCHAR(20)
AS
BEGIN
    DELETE FROM customers WHERE nik = @Nik;
END;
GO
