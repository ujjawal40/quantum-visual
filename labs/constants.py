"""Physical constants shared by every lab (SI units, CODATA 2018 exact/recommended values).

Usage in a notebook inside labs/<module>/:

    import sys; sys.path.append("..")
    from constants import *
"""

import math

# Fundamental constants
h = 6.62607015e-34          # Planck constant, J·s (exact)
hbar = h / (2 * math.pi)    # reduced Planck constant, J·s
c = 299_792_458.0           # speed of light, m/s (exact)
e = 1.602176634e-19         # elementary charge, C (exact)
k = 8.9875517923e9          # Coulomb constant 1/(4πε0), N·m²/C²
epsilon_0 = 8.8541878128e-12  # vacuum permittivity, F/m
k_B = 1.380649e-23          # Boltzmann constant, J/K (exact)
G = 6.67430e-11             # gravitational constant, N·m²/kg²

# Particle masses
m_e = 9.1093837015e-31      # electron mass, kg
m_p = 1.67262192369e-27     # proton mass, kg
m_n = 1.67492749804e-27     # neutron mass, kg
u = 1.66053906660e-27       # atomic mass unit, kg

# Atomic scales
a_0 = 5.29177210903e-11     # Bohr radius, m
alpha = 7.2973525693e-3     # fine-structure constant (≈ 1/137)
E_R = 13.605693122994       # Rydberg energy (hydrogen ground-state binding), eV
R_inf = 1.0973731568160e7   # Rydberg constant, 1/m

# Unit conversions
eV = e                      # 1 eV in joules
nm = 1e-9
fm = 1e-15
hc_eV_nm = h * c / eV / nm  # ≈ 1239.84 eV·nm


def joules_to_ev(E_joules):
    """Convert an energy from joules to electron-volts."""
    return E_joules / eV


def ev_to_joules(E_ev):
    """Convert an energy from electron-volts to joules."""
    return E_ev * eV


def photon_energy_ev(wavelength_nm):
    """Energy in eV of a photon with the given wavelength in nm."""
    return hc_eV_nm / wavelength_nm


def photon_wavelength_nm(energy_ev):
    """Wavelength in nm of a photon with the given energy in eV."""
    return hc_eV_nm / energy_ev


if __name__ == "__main__":
    print(f"hc            = {hc_eV_nm:.2f} eV·nm")
    print(f"1/alpha       = {1/alpha:.3f}")
    print(f"500 nm photon = {photon_energy_ev(500):.3f} eV")
