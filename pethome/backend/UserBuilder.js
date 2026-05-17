// =============================================
// Builder Pattern - User & Pet Builder
// =============================================
// بنبني الـ object خطوة خطوة بشكل readable
// بدل ما نبعت 10 parameters في constructor واحد

class UserBuilder {
  constructor() {
    this.user = {};
  }

  setName(firstName, lastName) {
    this.user.first_name = firstName;
    this.user.last_name = lastName;
    return this; // بنرجع this عشان نقدر نعمل chaining
  }

  setEmail(email) {
    this.user.email = email;
    return this;
  }

  setPassword(hashedPassword) {
    this.user.password = hashedPassword;
    return this;
  }

  setPhone(phone) {
    this.user.phone = phone;
    return this;
  }

  setRole(role) {
    const validRoles = ['adopter', 'shelter', 'rescuer', 'admin'];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role: ${role}`);
    }
    this.user.role = role;
    return this;
  }

  build() {
    // Validate required fields
    if (!this.user.first_name || !this.user.email || !this.user.password) {
      throw new Error('Missing required fields: name, email, password');
    }
    return this.user;
  }
}

// =============================================
// PetBuilder - لبناء الـ pet object خطوة خطوة
// =============================================
class PetBuilder {
  constructor() {
    this.pet = {};
  }

  setName(name) {
    this.pet.name = name;
    return this;
  }

  setType(type) {
    this.pet.type = type;
    return this;
  }

  setBreed(breed) {
    this.pet.breed = breed;
    return this;
  }

  setGender(gender) {
    this.pet.gender = gender;
    return this;
  }

  setAge(age) {
    this.pet.age = age;
    return this;
  }

  setHealth(healthStatus) {
    this.pet.health_status = healthStatus;
    return this;
  }

  setDescription(description) {
    this.pet.description = description;
    return this;
  }

  setLocation(location) {
    this.pet.location = location;
    return this;
  }

  setShelter(shelterId) {
    this.pet.shelter_id = shelterId;
    return this;
  }

  build() {
    if (!this.pet.name || !this.pet.type) {
      throw new Error('Missing required fields: name, type');
    }
    this.pet.status = 'available';
    return this.pet;
  }
}

module.exports = { UserBuilder, PetBuilder };