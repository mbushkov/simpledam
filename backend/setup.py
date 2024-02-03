from setuptools import find_namespace_packages
from setuptools import setup

setup_args = dict(
    name="newmedia",
    version="0.0.1",
    license="Apache License, Version 2.0",
    maintainer="Misha Bushkov",
    maintainer_email="realbushman@gmail.com",
    packages=find_namespace_packages(),
    entry_points={"console_scripts": ["newmedia_backend = newmedia.main:main", ]},
    install_requires=[
        "aiohttp[speedups]==3.8.3",
        "aiojobs==1.0.0",
        "aiosqlite==0.17.0",
        "bson==0.5.10",
        "exiv2==0.16.1",
        "numpy==1.26.3",
        "imagecodecs==2024.1.1",  # implicit dependency of tifffile
        "pillow==9.2.0",
        "pyobjc-core==8.5.1",
        "pyobjc-framework-Cocoa==8.5.1",
        "pyobjc-framework-LaunchServices==8.5.1",
        "rawpy==0.19.0",
        "tifffile==2024.1.30",
        "watchdog==2.1.9",
        "xattr==0.9.9",
    ],
    extras_require={
        "dev": [
            "pyinstaller==6.3.0",
            "ipython==8.5.0",
            "pytest==8.0.0",
            "pytest-asyncio==0.19.0",
        ],
    },
    data_files=[],
)

setup(**setup_args)
